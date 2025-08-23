import express from 'express';
import multer from 'multer';
import questionController from '../controllers/questionController.js';

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
  },
  fileFilter: (req, file, cb) => {
    const isJSON = file.mimetype === 'application/json' || file.originalname.endsWith('.json');
    const isCSV = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');
    const isExcel = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel' ||
                   file.originalname.endsWith('.xlsx') ||
                   file.originalname.endsWith('.xls');
    
    if (isJSON || isCSV || isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON, CSV and Excel files are allowed'), false);
    }
  },
});

router.get('/question', questionController.getQuestion);
router.get('/questions', questionController.getAllQuestions);
router.post('/questions/upload', upload.single('file'), questionController.uploadQuestions);
router.delete('/questions/clear', questionController.clearAllQuestions);

export default router;