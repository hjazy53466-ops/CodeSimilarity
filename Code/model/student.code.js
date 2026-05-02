import mongoose from "mongoose";

const StudentCodeSchema = new mongoose.Schema({
    studentName: { 
        type: String, 
        required: true 
    },
    codeContent: { 
        type: String, 
        required: true 
    },
    
    similarityScore: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// 
const studentCode = mongoose.model("StudentCode", StudentCodeSchema);
export default studentCode;