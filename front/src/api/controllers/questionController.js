import questionModel from '../models/questionModel.js';

class QuestionController {
  async getQuestion(req, res) {
    try {
      const { type } = req.query;
      if (!type) {
        return res.status(400).json({ error: 'Question type is required' });
      }

      await questionModel.loadQuestions();
      const question = questionModel.getRandomQuestion(type);

      if (!question) {
        return res.status(404).json({ message: 'No questions found for the selected type' });
      }

      res.json(question);
    } catch (error) {
      console.error('Error getting question:', error);
      res.status(500).json({ error: 'Failed to get question' });
    }
  }

  async uploadQuestions(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      let questionsData;
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      let importErrors = [];

      if (fileExtension === 'json') {
        const fileContent = req.file.buffer.toString('utf-8');
        questionsData = JSON.parse(fileContent);
        // (JSON导入的错误处理可以后续添加)
      } else if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        try {
          let results;
          if (fileExtension === 'csv') {
            const { default: csv } = await import('csv-parser');
            const { Readable } = await import('stream');
            const parsedResults = [];
            const bufferStream = Readable.from(req.file.buffer);
            await new Promise((resolve, reject) => {
              bufferStream.pipe(csv({ headers: false }))
                .on('data', (data) => parsedResults.push(Object.values(data)))
                .on('end', resolve)
                .on('error', reject);
            });
            results = parsedResults;
          } else { // Excel
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            results = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          }
          
          const { questions, errors } = await questionModel.convertTableDataToQuestions(results);
          questionsData = questions;
          importErrors = errors;
        } catch (error) {
          console.error(`Error processing ${fileExtension.toUpperCase()} file:`, error);
          return res.status(500).json({ success: false, message: `Failed to process ${fileExtension.toUpperCase()} file` });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Unsupported file format' });
      }

      const totalQuestions = questionsData ? Object.values(questionsData.categories).reduce((sum, cat) => sum + cat.questions.length, 0) : 0;

      if (totalQuestions > 0) {
        await questionModel.updateQuestionsData(questionsData);
      }

      // 如果有错误，在控制台输出详细错误信息
      if (importErrors.length > 0) {
        console.log('导入失败的题目详情:');
        importErrors.forEach(error => {
          console.log(`第${error.row}行: ${error.question || '未知题目'} - ${error.error}`);
        });
      }

      res.json({
        success: true,
        message: `导入完成。成功 ${totalQuestions} 条，失败 ${importErrors.length} 条。`,
        data: {
          successCount: totalQuestions,
          errorCount: importErrors.length,
          errors: importErrors
        }
      });
    } catch (error) {
      console.error('Error uploading questions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload questions'
      });
    }
  }

  async clearAllQuestions(req, res) {
    try {
      // 调用清空题库数据的方法
      await questionModel.clearQuestionsData();

      res.json({
        success: true,
        message: "题库已清空"
      });
    } catch (error) {
      console.error('Error clearing questions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to clear questions'
      });
    }
  }
}

export default new QuestionController();