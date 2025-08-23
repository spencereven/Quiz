<template>
  <div class="answer-display" v-if="visible">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="answer">
        <template #title>
          <span class="answer-title">
            <i class="el-icon-check"></i> 正确答案
          </span>
        </template>
        <div class="answer-content">
          <el-tag
            v-for="answer in correctAnswers"
            :key="answer"
            type="success"
            size="large"
          >
            {{ getOptionText(answer) }}
          </el-tag>
        </div>
      </el-collapse-item>

      <el-collapse-item name="explanation">
        <template #title>
          <span class="explanation-title">
            <i class="el-icon-info"></i> 答案解释
          </span>
        </template>
        <div class="explanation-content">
          {{ question.explanation }}
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuestionStore } from '../stores/questionStore';

const props = defineProps({
  visible: Boolean,
});

const questionStore = useQuestionStore();
const question = computed(() => questionStore.question);
const activeNames = ref(['answer', 'explanation']);

const correctAnswers = computed(() => {
  if (!question.value) return [];
  return Array.isArray(question.value.correctAnswer)
    ? question.value.correctAnswer
    : [question.value.correctAnswer];
});

const getOptionText = (optionId) => {
  if (!question.value) return '';
  const option = question.value.options.find((o) => o.id === optionId);
  return option ? option.text : '';
};
</script>

<style scoped>
.answer-display {
  margin: 20px 0;
  background: #f0f9ff;
  border-radius: 12px;
  overflow: hidden;
}

.answer-title,
.explanation-title {
  font-weight: bold;
  color: #409eff;
}

.answer-content {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

.explanation-content {
  line-height: 1.6;
  color: #606266;
  padding: 10px 0;
}
</style>