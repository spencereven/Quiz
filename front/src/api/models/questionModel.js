import { getDb } from '../database.js';

class QuestionModel {
  constructor() {
    this.db = getDb();
  }

  async loadQuestions() {
    // No-op, data is now loaded on demand from the DB
  }

  async getQuestionsByType(type) {
    const db = await this.db;
    const rows = await db.all('SELECT * FROM questions WHERE type = ?', type);
    return rows.map(row => ({
      ...row,
      options: JSON.parse(row.options),
      correctAnswer: row.type === 'multipleChoice' ? JSON.parse(row.correctAnswer) : row.correctAnswer,
      tags: JSON.parse(row.tags)
    }));
  }

  async getRandomQuestion(type) {
    const db = await this.db;
    const row = await db.get('SELECT * FROM questions WHERE type = ? ORDER BY RANDOM() LIMIT 1', type);
    if (!row) {
      return null;
    }
    return {
      ...row,
      options: JSON.parse(row.options),
      correctAnswer: row.type === 'multipleChoice' ? JSON.parse(row.correctAnswer) : row.correctAnswer,
      tags: JSON.parse(row.tags)
    };
  }

  async convertTableDataToQuestions(tableData) {
    const questions = [];
    const errors = [];

    let dataRows = tableData;
    let hasHeader = false;
    if (dataRows.length > 0 && (dataRows[0][0] === '序号' || dataRows[0][0] === 'index')) {
      dataRows = dataRows.slice(1);
      hasHeader = true;
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const originalRowIndex = hasHeader ? i + 2 : i + 1;

      if (row.every(cell => !cell)) continue;

      if (row.length < 11) {
        errors.push({ row: originalRowIndex, error: "行数据不完整，必须有11列" });
        continue;
      }
      
      const [index, type, question, optionA, optionB, optionC, optionD, optionE, optionF, optionG, answer] = row;
      
      if (!type || !question || !answer) {
        errors.push({ row: originalRowIndex, error: "题型、题干或答案不能为空" });
        continue;
      }
      
      let questionType, options, correctAnswer;
      
      try {
        if (type === '单选题') {
          questionType = 'singleChoice';
          options = [
            { id: 'a', text: optionA }, { id: 'b', text: optionB }, { id: 'c', text: optionC }, { id: 'd', text: optionD },
            { id: 'e', text: optionE }, { id: 'f', text: optionF }, { id: 'g', text: optionG }
          ].map(opt => ({ ...opt, text: typeof opt.text === 'string' ? opt.text.trim() : opt.text }))
           .filter(opt => opt.text);
          if (options.length < 2) throw new Error("单选题至少需要2个选项");
          correctAnswer = answer.toLowerCase();
        } else if (type === '多选题') {
          questionType = 'multipleChoice';
          options = [
            { id: 'a', text: optionA }, { id: 'b', text: optionB }, { id: 'c', text: optionC }, { id: 'd', text: optionD },
            { id: 'e', text: optionE }, { id: 'f', text: optionF }, { id: 'g', text: optionG }
          ].map(opt => ({ ...opt, text: typeof opt.text === 'string' ? opt.text.trim() : opt.text }))
           .filter(opt => opt.text);
          if (options.length < 2) throw new Error("多选题至少需要2个选项");
          correctAnswer = answer.replace(/[\s,]/g, '').toLowerCase().split('');
        } else if (type === '判断题') {
          questionType = 'trueFalse';
          options = [
            { id: 'a', text: optionA || '正确' },
            { id: 'b', text: optionB || '错误' }
          ];
          correctAnswer = answer.toLowerCase();
        } else {
          throw new Error(`未知的题型: "${type}"`);
        }

        const questionObj = {
          id: `${questionType.substring(0, 2)}${String(index || i).padStart(3, '0')}`,
          type: questionType,
          question,
          options,
          correctAnswer,
          explanation: "暂无解释",
          difficulty: "medium",
          category: "通用",
          tags: [type]
        };
        
        questions.push(questionObj);
      } catch (e) {
        errors.push({
          row: originalRowIndex,
          error: e.message,
          question: question || `第${originalRowIndex}行题目`
        });
      }
    }
    
    return { questions, errors };
  }

  async updateQuestionsData(newData) {
    const db = await this.db;
    const questions = newData.categories ? Object.values(newData.categories).flatMap(cat => cat.questions) : newData;

    try {
      await db.run('BEGIN TRANSACTION');
      const stmt = await db.prepare(
        'INSERT OR REPLACE INTO questions (id, type, question, options, correctAnswer, explanation, difficulty, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      for (const q of questions) {
        await stmt.run(
          q.id,
          q.type,
          q.question,
          JSON.stringify(q.options),
          q.type === 'multipleChoice' ? JSON.stringify(q.correctAnswer) : q.correctAnswer,
          q.explanation,
          q.difficulty,
          q.category,
          JSON.stringify(q.tags)
        );
      }

      await stmt.finalize();
      await db.run('COMMIT');
      return { success: true, message: 'Questions data updated successfully' };
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error updating questions data:', error);
      throw new Error('Failed to update questions data');
    }
  }

  async clearQuestionsData() {
    const db = await this.db;
    try {
      await db.run('DELETE FROM questions');
      return { success: true, message: 'Questions data cleared successfully' };
    } catch (error) {
      console.error('Error clearing questions data:', error);
      throw new Error('Failed to clear questions data');
    }
  }
}

export default new QuestionModel();