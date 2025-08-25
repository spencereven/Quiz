<template>
  <div class="home">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="答题" name="quiz">
        <div class="quiz-controls">
          <TypeSelector class="type-selector-box" />
          <el-card class="timer-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>答题计时器</span>
              </div>
            </template>
            <div class="timer-control">
              <el-form-item label="倒计时(秒):">
                <el-input-number v-model="countdownDuration" :min="0" controls-position="right" />
              </el-form-item>
              <el-button @click="toggleTimer" :type="isTimerRunning ? 'danger' : 'primary'" class="timer-button">
                {{ isTimerRunning ? '停止计时' : '开始计时' }}
              </el-button>
            </div>
          </el-card>
        </div>
        <QuestionCard v-if="question" :remaining-time="remainingTime" @show-answer="showAnswer" @hide-answer="hideAnswer" />
        <AnswerDisplay v-if="question" :visible="answerVisible" />
      </el-tab-pane>
      <el-tab-pane label="批量答题" name="batchQuiz">
        <BatchQuiz />
      </el-tab-pane>
      <el-tab-pane label="题库导入" name="upload">
        <QuestionUploader />
      </el-tab-pane>
      <el-tab-pane label="题库管理" name="manage">
        <QuestionBankViewer />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import TypeSelector from '../components/TypeSelector.vue';
import QuestionCard from '../components/QuestionCard.vue';
import AnswerDisplay from '../components/AnswerDisplay.vue';
import QuestionUploader from '../components/QuestionUploader.vue';
import QuestionBankViewer from '../components/QuestionBankViewer.vue';
import BatchQuiz from './BatchQuiz.vue';
import { useQuestionStore } from '../stores/questionStore';

const activeTab = ref('quiz');
const questionStore = useQuestionStore();
const question = computed(() => questionStore.question);
const answerVisible = ref(false);
const countdownDuration = ref(60); // 默认60秒
const remainingTime = ref(countdownDuration.value);
const timer = ref(null);

const isTimerRunning = computed(() => timer.value !== null);

const startTimer = () => {
  if (timer.value) clearInterval(timer.value);
  remainingTime.value = countdownDuration.value;
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--;
    } else {
      clearInterval(timer.value);
      timer.value = null;
    }
  }, 1000);
};

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

const toggleTimer = () => {
  if (isTimerRunning.value) {
    stopTimer();
  } else {
    startTimer();
  }
};


// 监听题目变化，重置答案显示状态并启动计时器
watch(question, (newQuestion, oldQuestion) => {
  if (newQuestion && newQuestion.id !== oldQuestion?.id) {
    answerVisible.value = false;
    if (countdownDuration.value > 0) {
      startTimer();
    }
  }
});

// 组件卸载时清除计时器
onUnmounted(() => {
  stopTimer();
});

const showAnswer = () => {
  answerVisible.value = true;
};

const hideAnswer = () => {
  answerVisible.value = false;
};
</script>

<style scoped>
.home {
  max-width: 95%; /* 设置所有页面为宽屏布局 */
  margin: 0 auto;
  padding: 20px;
  transition: max-width 0.3s ease;
}

.quiz-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.type-selector-box {
  flex: 1;
  min-width: 300px;
}

.timer-card {
  flex: 1;
  min-width: 300px;
  max-width: 450px;
}

.timer-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.timer-control .el-form-item {
  margin-bottom: 0;
}

.timer-button {
  margin-left: auto;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .quiz-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .timer-card {
    max-width: 100%;
  }
}
</style>