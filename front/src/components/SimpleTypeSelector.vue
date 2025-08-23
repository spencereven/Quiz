<template>
  <div class="simple-type-selector">
    <el-select 
      v-model="selectedType" 
      placeholder="请选择题型" 
      @change="onTypeChange"
      size="large"
    >
      <el-option
        v-for="item in questionTypes"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['type-selected']);

const selectedType = ref('');

const questionTypes = [
  { value: 'singleChoice', label: '单选题' },
  { value: 'multipleChoice', label: '多选题' },
  { value: 'trueFalse', label: '判断题' }
];

const onTypeChange = (type) => {
  emit('type-selected', type);
};
</script>

<style scoped>
.simple-type-selector {
  min-width: 200px;
}
</style>