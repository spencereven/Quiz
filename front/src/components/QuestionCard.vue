
<template>
  <div class="question-card" v-if="question">
    <div class="question-header">
      <div class="header-left">
        <el-tag :type="typeTag.type">{{ typeTag.label }}</el-tag>
        <el-tag size="small">{{ question.difficulty }}</el-tag>
      </div>
      <div v-if="remainingTime !== null" class="timer-display" :class="timerClass">
       <el-icon><Timer /></el-icon>
       <span>{{ formattedTime }}</span>
      </div>
    </div>

    <div class="question-content">
      <h3 class="text-lg font-semibold mb-4">{{ question.question }}</h3>

      <div class="options">
        <div
          v-for="option in question.options"
          :key="option.id"
          class="option-item"
          :class="getOptionClass(option.id)"
        >
          <div class="option-content">
            <el-checkbox
              v-if="questionType === 'multipleChoice'"
              v-model="selectedAnswers"
              :label="option.id"
              :disabled="hasSubmitted"
            >
              {{ option.text }}
            </el-checkbox>
            <el-radio
              v-else
              v-model="selectedAnswer"
              :label="option.id"
              :disabled="hasSubmitted"
            >
              {{ option.text }}
            </el-radio>
            <div class="option-feedback" v-if="hasSubmitted">
              <i v-if="isOptionCorrect(option.id)" class="el-icon-check correct-icon"></i>
              <i v-else-if="isOptionSelected(option.id)" class="el-icon-close incorrect-icon"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="answer-feedback" v-if="hasSubmitted && answerStatus">
      <div v-if="answerStatus === 'correct'" class="feedback correct-feedback">
        <i class="el-icon-check"></i> 回答正确！
      </div>
      <div v-else-if="answerStatus === 'partially-correct'" class="feedback partially-correct-feedback">
        <i class="el-icon-warning"></i> 基本正确，但答案不完整！
      </div>
      <div v-else-if="answerStatus === 'incorrect'" class="feedback incorrect-feedback">
        <i class="el-icon-close"></i> 回答错误！
      </div>
    </div>

    <div class="question-actions">
      <el-button
        v-if="!hasSubmitted"
        type="primary"
        @click="submitAnswer"
        :disabled="!hasSelectedAnswer"
      >
        <i class="el-icon-check"></i> 提交答案
      </el-button>
      <el-button
        v-if="hasSubmitted"
        type="success"
        @click="showAnswer"
      >
        <i class="el-icon-view"></i> 查看解析
      </el-button>
      <el-button
        v-if="hasSubmitted"
        type="info"
        @click="resetSelection"
      >
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { Timer } from '@element-plus/icons-vue';

const props = defineProps({
  remainingTime: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['show-answer', 'hide-answer']);
const questionStore = useQuestionStore();
const question = computed(() => questionStore.question);
const questionType = computed(() => {
  if (!question.value) return '';
  if (Array.isArray(question.value.correctAnswer)) {
    return 'multipleChoice';
  }
  if (question.value.options.length === 2 && question.value.options.every(o => ['正确', '错误'].includes(o.text))) {
    return 'trueFalse';
  }
  return 'singleChoice';
});

const typeTag = computed(() => {
  switch (questionType.value) {
    case 'singleChoice':
      return { type: 'primary', label: '单选题' };
    case 'multipleChoice':
      return { type: 'success', label: '多选题' };
    case 'trueFalse':
      return { type: 'warning', label: '判断题' };
    default:
      return { type: 'info', label: '未知' };
  }
});

const formattedTime = computed(() => {
  if (props.remainingTime === null) return '00:00';
  const minutes = Math.floor(props.remainingTime / 60);
  const seconds = props.remainingTime % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const timerClass = computed(() => {
  if (props.remainingTime === 0) {
    return 'time-up';
  }
  if (props.remainingTime !== null && props.remainingTime <= 10) {
    return 'low-time';
  }
  return '';
});

const selectedAnswer = ref('');
const selectedAnswers = ref([]);
const hasSubmitted = ref(false);

const correctAnswers = computed(() => {
  if (!question.value) return [];
  return Array.isArray(question.value.correctAnswer)
    ? question.value.correctAnswer
    : [question.value.correctAnswer];
});

const isAnswerFullyCorrect = computed(() => {
  if (!question.value || !hasSubmitted.value) return false;
  if (questionType.value !== 'multipleChoice') {
    return selectedAnswer.value === correctAnswers.value[0];
  }
  
  // 多选题新逻辑：用户选择的答案必须全部是正确答案（允许少选）
  return selectedAnswers.value.every(selectedId =>
    correctAnswers.value.includes(selectedId)
  );
});

const hasSelectedAnswer = computed(() => {
  if (questionType.value === 'multipleChoice') {
    return selectedAnswers.value.length > 0;
  }
  return selectedAnswer.value !== '';
});

const answerStatus = computed(() => {
  if (!question.value || !hasSubmitted.value) return null;

  if (questionType.value !== 'multipleChoice') {
    return selectedAnswer.value === correctAnswers.value[0] ? 'correct' : 'incorrect';
  }

  // 多选题逻辑
  const selected = selectedAnswers.value;
  const correct = correctAnswers.value;

  // 检查是否选了任何错误答案
  const hasIncorrectSelection = selected.some(id => !correct.includes(id));
  if (hasIncorrectSelection) {
    return 'incorrect';
  }

  // 如果没有选错，检查是否选全了
  if (selected.length === correct.length) {
    return 'correct';
  }

  // 如果没有选错，但也没选全，则为部分正确
  return 'partially-correct';
});

const isOptionCorrect = (optionId) => {
  return correctAnswers.value.includes(optionId);
};

const isOptionSelected = (optionId) => {
  if (questionType.value === 'multipleChoice') {
    return selectedAnswers.value.includes(optionId);
  }
  return selectedAnswer.value === optionId;
};

const getOptionClass = (optionId) => {
  if (!hasSubmitted.value) {
    return isOptionSelected(optionId) ? 'selected' : '';
  }

  // 多选题的新逻辑
  if (questionType.value === 'multipleChoice') {
    const isCorrect = isOptionCorrect(optionId);
    const isSelected = isOptionSelected(optionId);

    if (isCorrect) {
      // 如果是完全正确，所有正确选项都标绿
      if (answerStatus.value === 'correct') {
        return 'correct';
      }
      // 如果是部分正确或错误，未被选中的正确选项标绿（作为提示）
      // 被选中的正确选项在部分正确时标红（表示不完整）
      if (answerStatus.value === 'partially-correct' || answerStatus.value === 'incorrect') {
        return isSelected ? 'incorrect' : 'correct';
      }
    }
    if (isSelected && !isCorrect) {
      // 选错的选项标红
      return 'incorrect';
    }
  } else {
    // 单选题和判断题的逻辑保持不变
    if (isOptionCorrect(optionId)) {
      return 'correct';
    }
    if (isOptionSelected(optionId) && !isOptionCorrect(optionId)) {
      return 'incorrect';
    }
  }
  
  return '';
};

const isSelected = (optionId) => {
  return isOptionSelected(optionId);
};

const submitAnswer = () => {
  hasSubmitted.value = true;
};

const resetSelection = () => {
  hasSubmitted.value = false;
  selectedAnswer.value = '';
  selectedAnswers.value = [];
  emit('hide-answer');
};

const showAnswer = () => {
  emit('show-answer');
};

// 监听 question 的变化，当题目切换时重置选择
watch(question, (newQuestion, oldQuestion) => {
  // 只有当 question 确实从一个对象变为另一个对象时才重置
  // 避免在初始加载或 question 被清空时进行不必要的重置
  if (newQuestion && oldQuestion && newQuestion.id !== oldQuestion.id) {
    resetSelection();
  }
});

// 监听剩余时间，时间到则自动提交
watch(() => props.remainingTime, (newTime) => {
  if (newTime === 0 && !hasSubmitted.value) {
    submitAnswer();
  }
});
</script>

<style scoped>
.question-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  gap: 10px;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 18px;
  font-weight: bold;
  color: #606266;
  transition: color 0.3s ease;
}

.timer-display.low-time {
  color: #e6a23c;
}

.timer-display.time-up {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.question-content h3 {
  font-size: 18px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.options {
  margin: 20px 0;
}

.option-item {
  margin: 12px 0;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.option-item:hover {
  background-color: #f5f7fa;
}

.option-item.selected {
  background-color: #ecf5ff;
  border-left: 4px solid #409eff;
}

.option-item.correct {
  background-color: #f0f9ff;
  border: 2px solid #67c23a;
  border-radius: 8px;
}

.option-item.incorrect {
  background-color: #fef0f0;
  border: 2px solid #f56c6c;
  border-radius: 8px;
}

.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.option-feedback {
  margin-left: 10px;
}

.correct-icon {
  color: #67c23a;
  font-size: 20px;
  font-weight: bold;
}

.incorrect-icon {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.answer-feedback {
  text-align: center;
  margin: 20px 0;
  padding: 15px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.correct-feedback {
  color: #67c23a;
  background-color: #f0f9ff;
  border: 1px solid #67c23a;
}

.partially-correct-feedback {
  color: #e6a23c;
  background-color: #fdf6ec;
  border: 1px solid #e6a23c;
}

.incorrect-feedback {
  color: #f56c6c;
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
}

.question-actions {
  text-align: center;
  margin-top: 20px;
}
</style>