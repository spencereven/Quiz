import express from 'express';
import cors from 'cors';
import multer from 'multer';
import questionRoutes from './src/api/routes/questionRoutes.js';

const app = express();
const port = 3000;

app.use(cors());
app.use('/api', questionRoutes);

// 全局错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 相关的错误
    return res.status(400).json({ success: false, message: `文件上传错误: ${err.message}` });
  } else if (err) {
    // 其他在上传过程中由 fileFilter 抛出的错误
    return res.status(400).json({ success: false, message: err.message });
  }
  // 如果不是上传错误，传递给 Express 的默认错误处理器
  next(err);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});