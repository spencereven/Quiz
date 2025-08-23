import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

class QuestionModel {
  constructor() {
    this.questionsData = null;
    // 使用 import.meta.url 和 fileURLToPath 来获得更可靠的路径
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // 从当前文件（models）向上两级到 src，然后进入 public 目录
    this.dataPath = path.resolve(__dirname, '..', '..', 'public', 'questions.json');
  }

  async loadQuestions() {
    if (this.questionsData) {
      return;
    }
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.questionsData = JSON.parse(data);
    } catch (error) {
      console.error('Error loading questions data:', error);
      throw new Error('Failed to load questions data');
    }
  }

  getQuestionsByType(type) {
    if (!this.questionsData || !this.questionsData.categories[type]) {
      return [];
    }
    return this.questionsData.categories[type].questions;
  }

  getRandomQuestion(type) {
    const questions = this.getQuestionsByType(type);
    if (questions.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  async convertTableDataToQuestions(tableData) {
    const questions = {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      categories: {
        singleChoice: { name: "单选题", description: "只有一个正确答案的选择题", questions: [] },
        multipleChoice: { name: "多选题", description: "有多个正确答案的选择题", questions: [] },
        trueFalse: { name: "判断题", description: "判断陈述是否正确", questions: [] }
      }
    };
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

      if (row.every(cell => !cell)) continue; // 跳过完全是空的行

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
          question,
          options,
          correctAnswer,
          explanation: "暂无解释",
          difficulty: "medium",
          category: "通用",
          tags: [type]
        };
        
        questions.categories[questionType].questions.push(questionObj);
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
    try {
      // 首先加载现有数据
      await this.loadQuestions();
      
      // 合并新旧数据
      if (this.questionsData && newData) {
        // 保留原有数据的基本信息
        const mergedData = {
          ...this.questionsData,
          lastUpdated: new Date().toISOString(),
          categories: {
            singleChoice: {
              ...this.questionsData.categories.singleChoice,
              questions: [...this.questionsData.categories.singleChoice.questions, ...(newData.categories.singleChoice?.questions || [])]
            },
            multipleChoice: {
              ...this.questionsData.categories.multipleChoice,
              questions: [...this.questionsData.categories.multipleChoice.questions, ...(newData.categories.multipleChoice?.questions || [])]
            },
            trueFalse: {
              ...this.questionsData.categories.trueFalse,
              questions: [...this.questionsData.categories.trueFalse.questions, ...(newData.categories.trueFalse?.questions || [])]
            }
          }
        };
        
        // 更新内存中的数据
        this.questionsData = mergedData;
        
        // 写入文件
        await fs.writeFile(this.dataPath, JSON.stringify(mergedData, null, 2), 'utf-8');
        
        return { success: true, message: 'Questions data updated successfully' };
      } else if (newData) {
        // 如果没有现有数据，直接使用新数据
        this.questionsData = newData;
        await fs.writeFile(this.dataPath, JSON.stringify(newData, null, 2), 'utf-8');
        return { success: true, message: 'Questions data updated successfully' };
      } else {
        throw new Error('No data to update');
      }
    } catch (error) {
      console.error('Error updating questions data:', error);
      throw new Error('Failed to update questions data');
    }
  }

  async clearQuestionsData() {
    try {
      // 创建空的题库数据结构
      const emptyQuestionsData = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        categories: {
          singleChoice: { name: "单选题", description: "只有一个正确答案的选择题", questions: [] },
          multipleChoice: { name: "多选题", description: "有多个正确答案的选择题", questions: [] },
          trueFalse: { name: "判断题", description: "判断陈述是否正确", questions: [] }
        }
      };

      // 更新内存中的数据
      this.questionsData = emptyQuestionsData;
      
      // 写入文件
      await fs.writeFile(this.dataPath, JSON.stringify(emptyQuestionsData, null, 2), 'utf-8');
      
      return { success: true, message: 'Questions data cleared successfully' };
    } catch (error) {
      console.error('Error clearing questions data:', error);
      throw new Error('Failed to clear questions data');
    }
  }

  validateQuestionsData(data) {
    // 检查基本结构
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.lastUpdated || !data.categories) return false;
    
    // 检查categories结构
    const validTypes = ['singleChoice', 'multipleChoice', 'trueFalse'];
    for (const type of validTypes) {
      if (data.categories[type]) {
        const category = data.categories[type];
        if (!category.name || !Array.isArray(category.questions)) return false;
        
        // 检查每个题目
        for (const question of category.questions) {
          if (!this.validateQuestion(question, type)) return false;
        }
      }
    }
    
    return true;
  }

  validateQuestion(question, type) {
    // 检查必填字段
    const requiredFields = ['id', 'question', 'options', 'correctAnswer', 'explanation', 'difficulty'];
    for (const field of requiredFields) {
      if (!question[field]) return false;
    }
    
    // 检查options
    if (!Array.isArray(question.options) || question.options.length < 2) return false;
    
    // 检查correctAnswer格式
    if (type === 'multipleChoice') {
      if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) return false;
    } else {
      if (typeof question.correctAnswer !== 'string') return false;
    }
    
    // 检查选项ID是否正确
    const optionIds = question.options.map(opt => opt.id);
    if (type === 'multipleChoice') {
      for (const answerId of question.correctAnswer) {
        if (!optionIds.includes(answerId)) return false;
      }
    } else {
      if (!optionIds.includes(question.correctAnswer)) return false;
    }
    
    return true;
  }
}

export default new QuestionModel();