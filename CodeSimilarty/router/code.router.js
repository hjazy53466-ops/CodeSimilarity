import express from "express";
import fs from "node:fs";
import path from "path";
import { cleanCode, getLevenshtein, getJaccard, getCosine } from "../utils.js";
import studentCode from "../model/student.code.js";
import multer from "multer";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "student_codes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const requiredCodes = 5;

const upload = multer({ dest: "temp/" });

router.post(
  "/upload-student-code",
  upload.single("codeFile"),
  async (req, res) => {
    try {
    
      let { code, studentName } = req.body;

     
      if (req.file) {
        code = fs.readFileSync(req.file.path, "utf8");
        fs.unlinkSync(req.file.path); 
      }

      if (!code || !studentName) {
        return res
          .status(400)
          .json({ error: "please input code or file and enter studentName" });
      }

     
      const fileName = `${studentName}.js`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, code, "utf8");

      
      await studentCode.findOneAndUpdate(
        { studentName: studentName },
        { codeContent: code },
        { upsert: true, 
          returnDocument: "after" },
      );

      const allFiles = fs
        .readdirSync(uploadDir)
        .filter((f) => f.endsWith(".js"));
      const fileCount = allFiles.length;

      
      const codesData = allFiles.map((file, index) => {
        const content = fs.readFileSync(path.join(uploadDir, file), "utf8");
        return {
          id: index,
          name: file.replace(".js", ""),
          cleaned: cleanCode(content),
        };
      });

      let matrixResults = [];
      let averages = []; 

     
      for (let i = 0; i < codesData.length; i++) {
        let totalSimilarityForStudent = 0;

        for (let j = 0; j < codesData.length; j++) {
          if (i === j) {
            matrixResults.push({ row: i, col: j, score: "100.00" });
            continue;
          }

          const c1 = codesData[i].cleaned;
          const c2 = codesData[j].cleaned;

          const lev = getLevenshtein(c1, c2);
          const cos = getCosine(c1, c2);
          const jac = getJaccard(c1, c2);

          const finalScore = parseFloat(
            (cos * 0.4 + lev * 0.3 + jac * 0.3).toFixed(2),
          );
          totalSimilarityForStudent += finalScore;

          matrixResults.push({
            row: i,
            col: j,
            score: finalScore.toString(),
            details: {
              lev: lev.toFixed(1),
              cos: cos.toFixed(1),
              jac: jac.toFixed(1),
            },
          });
        }

       
        const avg =
          codesData.length > 1
            ? (totalSimilarityForStudent / (codesData.length - 1)).toFixed(2)
            : "0.00";
        averages.push({ student: codesData[i].name, averageSimilarity: avg });
      }

      
      if (fileCount >= requiredCodes) {
        return res.json({
          message: `Success ❤ ${requiredCodes} codes reached. Comparison completed.`,
          count: fileCount,
          required: requiredCodes,
          autoCompare: true,
          matrix: matrixResults,
          studentAverages: averages, 
        });
      }

      res.json({
        message: `Code saved as ${studentName}`,
        count: fileCount,
        required: requiredCodes,
        autoCompare: false,
      });
    } catch (error) {
      console.error("Critical Upload Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

router.get("/compare-stored", (req, res) => {
  const files = fs.readdirSync(uploadDir).filter((f) => f.endsWith(".js"));

  if (files.length < 5)
    return res.status(400).json({ error: "Need at least 5 codes" });

  const codesData = files.map((file) => ({
    name: file.replace(".js", ""),
    content: fs.readFileSync(path.join(uploadDir, file), "utf8"),
  }));

  const cleanedCodes = codesData.map((c) => cleanCode(c.content));

  let matrixResults = [];

  for (let i = 0; i < cleanedCodes.length; i++) {
    for (let j = 0; j < cleanedCodes.length; j++) {
      if (i === j) {
        matrixResults.push({ row: i, col: j, score: "100.00" });
        continue;
      }

      const lev = getLevenshtein(cleanedCodes[i], cleanedCodes[j]);
      const cos = getCosine(cleanedCodes[i], cleanedCodes[j]);
      const jac = getJaccard(cleanedCodes[i], cleanedCodes[j]);

      const finalScore = (cos * 0.4 + lev * 0.3 + jac * 0.3).toFixed(2);

      matrixResults.push({
        row: i,
        col: j,
        score: finalScore,
      });
    }
  }


  const students = codesData.map((c) => c.name);

  res.json({
    matrix: matrixResults,
    size: files.length,
    students: students, 
  });
});

router.delete("/clear-all", (req, res) => {
  const files = fs.readdirSync(uploadDir);
  files.forEach((file) => fs.unlinkSync(path.join(uploadDir, file)));
  res.json({ message: "All files cleared" });
});

export default router;
