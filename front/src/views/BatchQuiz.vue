<template>
  <div class="batch-quiz">
    <TypeSelector
      mode="batch"
      @type-selected="handleTypeSelected"
      @start-batch-quiz="fetchBatchQuestions"
    />

    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" show-icon />
    </div>

    <div v-if="questions.length > 0" class="question-list">
      <el-card
        v-for="(question, index) in questions"
        :key="question.id"
        class="question-card"
        :class="{ 'is-correct': showResults && question.userIsCorrect, 'is-wrong': showResults && !question.userIsCorrect }"
        :body-style="{ padding: '20px' }"
      >
        <template #header>
          <div class="card-header">
            <span>题目 {{ index + 1 }}</span>
            <el-tag size="small">{{ question.type === 'singleChoice' ? '单选' : question.type === 'multipleChoice' ? '多选' : '判断' }}</el-tag>
          </div>
        </template>
        <div class="question-content">
          <p class="question-text">{{ question.question }}</p>
          <div class="options">
            <el-radio-group v-if="question.type === 'singleChoice' || question.type === 'trueFalse'" v-model="userAnswers[question.id]" :disabled="showResults">
              <el-radio v-for="option in question.options" :key="option.id" :label="option.id" :class="getOptionClass(question, option.id)">
                {{ option.id.toUpperCase() }}. {{ option.text }}
              </el-radio>
            </el-radio-group>
            <el-checkbox-group v-if="question.type === 'multipleChoice'" v-model="userAnswers[question.id]" :disabled="showResults">
              <el-checkbox v-for="option in question.options" :key="option.id" :label="option.id" :class="getOptionClass(question, option.id)">
                {{ option.id.toUpperCase() }}. {{ option.text }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="questions.length > 0" class="submission-area">
      <el-button v-if="!showResults" type="success" size="large" @click="checkAnswers">提交答案</el-button>
      <div v-if="showResults" class="results-display">
        <el-alert
          :title="`答题结束！您的得分是：${score} / ${questions.length}`"
          type="success"
          :closable="false"
          show-icon
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TypeSelector from '../components/TypeSelector.vue';

const selectedType = ref('');
const questions = ref([]);
const loading = ref(false);
const error = ref(null);
const userAnswers = ref({});
const showResults = ref(false);
const score = ref(0);

const handleTypeSelected = (type) => {
  selectedType.value = type;
  questions.value = []; // 类型改变时清空题目
  error.value = null;
};

const fetchBatchQuestions = async () => {
  if (!selectedType.value) return;

  loading.value = true;
  error.value = null;
  questions.value = [];
  showResults.value = false;
  score.value = 0;

  try {
    const response = await fetch(`/api/questions/random?type=${selectedType.value}&count=5`);
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || '抽取题目失败');
    }
    const data = await response.json();
    questions.value = data;
    // 初始化用户答案
    userAnswers.value = data.reduce((acc, q) => {
      acc[q.id] = q.type === 'multipleChoice' ? [] : null;
      return acc;
    }, {});
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const checkAnswers = () => {
  score.value = 0;
  questions.value.forEach(q => {
    const userAnswer = userAnswers.value[q.id];
    const correctAnswer = q.correctAnswer;
    let isCorrect = false;

    if (q.type === 'multipleChoice') {
      // 多选题：答案数组需要完全匹配
      if (Array.isArray(userAnswer) && userAnswer.sort().join(',') === correctAnswer.sort().join(',')) {
        isCorrect = true;
      }
    } else {
      // 单选题和判断题
      if (userAnswer === correctAnswer) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      score.value++;
    }
    q.userIsCorrect = isCorrect; // 在题目对象上标记对错
  });
  showResults.value = true;
};

const getOptionClass = (question, optionId) => {
  if (!showResults.value) return '';
  
  const correctAnswer = question.correctAnswer;
  const userAnswer = userAnswers.value[question.id];

  if (question.type === 'multipleChoice') {
    if (correctAnswer.includes(optionId)) {
      return 'correct-answer';
    }
    if (userAnswer.includes(optionId) && !correctAnswer.includes(optionId)) {
      return 'wrong-answer';
    }
  } else {
    if (optionId === correctAnswer) {
      return 'correct-answer';
    }
    if (optionId === userAnswer && userAnswer !== correctAnswer) {
      return 'wrong-answer';
    }
  }
  return '';
};
</script>

<style scoped>
.batch-quiz {
  padding: 20px;
}
.error-message {
  margin-bottom: 20px;
}
.question-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); /* 响应式网格 */
  gap: 20px;
  padding: 20px;
}
@media (min-width: 1200px) {
  .question-list {
    grid-template-columns: repeat(3, 1fr); /* 在大屏幕上严格三列 */
  }
}
.question-card {
  transition: box-shadow 0.3s ease;
  min-height: 250px; /* 设置最小高度以容纳内容 */
  display: flex;
  flex-direction: column;
}
.question-card .question-content {
  flex-grow: 1; /* 让内容区域填充剩余空间 */
}
.question-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.question-card.is-wrong :deep(.el-card__header) {
  background-color: #fef0f0; /* 红色背景 */
  color: #f56c6c;
}
.question-card.is-correct :deep(.el-card__header) {
  background-color: #f0f9eb; /* 绿色背景 */
  color: #67c23a;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.question-text {
  font-weight: bold;
  margin-bottom: 15px;
}
.options .el-radio-group,
.options .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.submission-area {
  margin-top: 30px;
  text-align: center;
}
.results-display {
  margin-top: 20px;
}
:deep(.correct-answer) {
  color: #67c23a;
  font-weight: bold;
}
:deep(.wrong-answer) {
  color: #f56c6c;
}
:deep(.correct-answer .el-radio__label),
:deep(.correct-answer .el-checkbox__label) {
  color: #67c23a !important;
}
:deep(.wrong-answer .el-radio__label),
:deep(.wrong-answer .el-checkbox__label) {
  color: #f56c6c !important;
}
:deep(.el-radio),
:deep(.el-checkbox) {
  height: auto !important; /* 允许组件高度自适应 */
  margin-bottom: 10px; /* 增加选项间的垂直间距 */
  display: flex;
  align-items: flex-start; /* 垂直居上对齐 */
}
:deep(.el-radio__label),
:deep(.el-checkbox__label) {
  white-space: normal; /* 允许选项文本换行 */
  word-break: break-all;
  line-height: 1.5; /* 增加行高 */
  padding-left: 5px; /* 增加与按钮的间距 */
}
</style>