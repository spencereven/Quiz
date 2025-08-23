<template>
  <div class="home">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="答题" name="quiz">
        <TypeSelector />
        <QuestionCard v-if="question" @show-answer="showAnswer" @hide-answer="hideAnswer" />
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
import { computed, ref, watch } from 'vue';
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

// 监听题目变化，重置答案显示状态
watch(question, (newQuestion, oldQuestion) => {
  if (newQuestion !== oldQuestion) {
    answerVisible.value = false;
  }
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>