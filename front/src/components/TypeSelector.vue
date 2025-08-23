<template>
  <div class="type-selector">
    <h3 class="text-2xl font-bold text-white mb-4">抽取题型</h3>
    
    <!-- 选择题型 -->
    <div v-if="currentStep === 1">
      <div class="carousel-container">
        <div
          class="carousel-item"
          :class="{ active: currentTypeCarouselIndex === index }"
          v-for="(type, index) in questionTypes"
          :key="type.value"
        >
          <div class="carousel-card">
            <div class="carousel-icon">
              <i :class="type.icon"></i>
            </div>
            <div class="carousel-title">{{ type.label }}</div>
          </div>
        </div>
      </div>
      
      <div class="button-controls">
        <el-button
          type="primary"
          size="large"
          @click="startTypeCarousel"
          :loading="typeCarouselLoading"
          v-if="!typeCarouselRunning"
        >
          <i class="el-icon-video-play"></i> 开始轮播选择题型
        </el-button>
        
        <div class="carousel-controls" v-if="typeCarouselRunning">
          <el-button
            type="success"
            size="large"
            @click="confirmTypeSelection"
          >
            <i class="el-icon-check"></i> 确定题型
          </el-button>
          <el-button
            type="danger"
            size="large"
            @click="stopTypeCarousel"
          >
            <i class="el-icon-close"></i> 停止轮播
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 选择题目 -->
    <div v-else-if="currentStep === 2">
      <div class="selected-type">
        <el-tag :type="typeTag.type" size="large">
          <i :class="typeTag.icon"></i> {{ typeTag.label }}
        </el-tag>
      </div>
      
      <div class="button-controls">
        <el-button
          type="success"
          size="large"
          @click="fetchRandomQuestion"
          :loading="questionLoading"
        >
          <i class="el-icon-s-help"></i> 随机抽取题目
        </el-button>
        
        <el-button
          type="primary"
          size="large"
          @click="backToTypeSelection"
        >
          <i class="el-icon-back"></i> 重新选择题型
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuestionStore } from '../stores/questionStore';

const selectedType = ref('');
const questionStore = useQuestionStore();
const questionLoading = ref(false);

// 步骤控制
const currentStep = ref(1); // 1: 选择题型, 2: 选择题目

// 题型轮播相关变量
const typeCarouselRunning = ref(false);
const typeCarouselLoading = ref(false);
const currentTypeCarouselIndex = ref(0);
const typeCarouselInterval = ref(null);

const questionTypes = [
  { value: 'singleChoice', label: '单选题', icon: 'el-icon-s-help', type: 'primary' },
  { value: 'multipleChoice', label: '多选题', icon: 'el-icon-s-check', type: 'success' },
  { value: 'trueFalse', label: '判断题', icon: 'el-icon-s-opportunity', type: 'warning' }
];

const typeTag = computed(() => {
  if (!selectedType.value) return { label: '', icon: '', type: '' };
  return questionTypes.find(type => type.value === selectedType.value) || { label: '', icon: '', type: '' };
});

const currentType = computed(() => {
  return questionTypes[currentTypeCarouselIndex.value];
});

// 题型轮播相关方法
const startTypeCarousel = () => {
  typeCarouselLoading.value = true;
  typeCarouselRunning.value = true;
  
  // 设置轮播间隔
  typeCarouselInterval.value = setInterval(() => {
    currentTypeCarouselIndex.value = (currentTypeCarouselIndex.value + 1) % questionTypes.length;
  }, 80); // 每80毫秒切换一次，更快
  
  typeCarouselLoading.value = false;
};

const stopTypeCarousel = () => {
  typeCarouselRunning.value = false;
  if (typeCarouselInterval.value) {
    clearInterval(typeCarouselInterval.value);
    typeCarouselInterval.value = null;
  }
};

const confirmTypeSelection = () => {
  stopTypeCarousel();
  selectedType.value = currentType.value.value;
  // 进入下一步
  currentStep.value = 2;
};

const backToTypeSelection = () => {
  // 返回上一步
  currentStep.value = 1;
  // 清空当前题目
  questionStore.question = null;
};

const fetchRandomQuestion = async () => {
  questionLoading.value = true;
  await questionStore.fetchQuestion(selectedType.value);
  questionLoading.value = false;
};
</script>

<style scoped>
.type-selector {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  color: white;
}

.selected-type {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.selected-type .el-tag {
  font-size: 18px;
  padding: 10px 20px;
}

/* 轮播模式样式 */
.carousel-container {
  position: relative;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 15px 0;
  perspective: 800px;
  overflow: visible;
}

.carousel-item {
  position: absolute;
  width: 120px;
  height: 80px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-style: preserve-3d;
}

.carousel-card {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.carousel-icon {
  font-size: 20px;
  margin-bottom: 5px;
  color: white;
}

.carousel-title {
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.carousel-item:not(.active) {
  opacity: 0.4;
  transform: scale(0.7) translateZ(-80px) rotateY(25deg);
}

.carousel-item.active {
  opacity: 1;
  transform: scale(1.1) translateZ(60px) rotateY(0deg);
  z-index: 10;
}

.carousel-item.active .carousel-card {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* 轮播项的位置 */
.carousel-item:nth-child(1) {
  left: calc(50% - 160px);
}

.carousel-item:nth-child(2) {
  left: calc(50% - 60px);
}

.carousel-item:nth-child(3) {
  left: calc(50% + 40px);
}

/* 激活状态下的位置调整 */
.carousel-item.active:nth-child(1) {
  left: calc(50% - 60px);
}

.carousel-item.active:nth-child(2) {
  left: calc(50% - 60px);
}

.carousel-item.active:nth-child(3) {
  left: calc(50% - 60px);
}

.button-controls {
  margin-top: 70px;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 15px 0;
}

/* 添加闪烁动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.carousel-item.active .carousel-card {
  animation: pulse 1.2s infinite;
}
</style>