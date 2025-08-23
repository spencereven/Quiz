<template>
  <div class="question-bank-viewer">
    <el-card class="viewer-card">
      <template #header>
        <div class="card-header">
          <span>题库管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索题目..."
              class="search-input"
              clearable
              @input="filterQuestions"
            >
              <template #prefix>
                <el-icon><search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="typeFilter" placeholder="题型筛选" clearable @change="filterQuestions">
              <el-option label="全部题型" value="" />
              <el-option label="单选题" value="singleChoice" />
              <el-option label="多选题" value="multipleChoice" />
              <el-option label="判断题" value="trueFalse" />
            </el-select>
          </div>
        </div>
      </template>

      <div class="question-stats">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ questionStats.total }}</div>
                <div class="stat-label">总题目数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ questionStats.singleChoice }}</div>
                <div class="stat-label">单选题</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ questionStats.multipleChoice }}</div>
                <div class="stat-label">多选题</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ questionStats.trueFalse }}</div>
                <div class="stat-label">判断题</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ questionStats.easy }}</div>
                <div class="stat-label">简单</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ questionStats.medium }}</div>
                <div class="stat-label">中等</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="question-list">
        <div v-if="filteredQuestions.length === 0" class="empty-state">
          <el-empty description="没有找到符合条件的题目" />
        </div>
        <div v-else>
          <div v-for="(question, index) in paginatedQuestions" :key="question.id" class="question-item">
            <el-card shadow="hover" class="question-card">
              <div class="question-header">
                <div class="question-meta">
                  <el-tag :type="getTypeTag(question.type).type" size="small">
                    {{ getTypeTag(question.type).label }}
                  </el-tag>
                  <el-tag :type="getDifficultyTag(question.difficulty).type" size="small">
                    {{ getDifficultyTag(question.difficulty).label }}
                  </el-tag>
                  <span class="question-id">{{ question.id }}</span>
                </div>
                <div class="question-actions">
                  <el-button type="primary" size="small" @click="previewQuestion(question)">
                    <el-icon><view /></el-icon> 预览
                  </el-button>
                </div>
              </div>
              <div class="question-content">
                <h4>{{ question.question }}</h4>
                <div class="question-options">
                  <div v-for="option in question.options" :key="option.id" class="option-item">
                    <span class="option-label">{{ option.id.toUpperCase() }}.</span>
                    <span class="option-text">{{ option.text }}</span>
                  </div>
                </div>
              </div>
              <div class="question-footer">
                <div class="correct-answer">
                  <strong>正确答案：</strong>
                  <span v-if="Array.isArray(question.correctAnswer)">
                    {{ question.correctAnswer.map(ans => ans.toUpperCase()).join(', ') }}
                  </span>
                  <span v-else>{{ question.correctAnswer.toUpperCase() }}</span>
                </div>
                <div class="question-tags">
                  <el-tag v-for="tag in question.tags" :key="tag" size="small" effect="plain">
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </div>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredQuestions.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 题目预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="题目预览"
      width="70%"
      class="preview-dialog"
    >
      <div v-if="previewQuestionData">
        <div class="preview-header">
          <el-tag :type="getTypeTag(previewQuestionData.type).type">
            {{ getTypeTag(previewQuestionData.type).label }}
          </el-tag>
          <el-tag :type="getDifficultyTag(previewQuestionData.difficulty).type">
            {{ getDifficultyTag(previewQuestionData.difficulty).label }}
          </el-tag>
          <span class="preview-id">{{ previewQuestionData.id }}</span>
        </div>
        <div class="preview-content">
          <h3>{{ previewQuestionData.question }}</h3>
          <div class="preview-options">
            <div v-for="option in previewQuestionData.options" :key="option.id" class="preview-option">
              <span class="option-label">{{ option.id.toUpperCase() }}.</span>
              <span class="option-text">{{ option.text }}</span>
            </div>
          </div>
        </div>
        <div class="preview-footer">
          <div class="preview-answer">
            <strong>正确答案：</strong>
            <span v-if="Array.isArray(previewQuestionData.correctAnswer)">
              {{ previewQuestionData.correctAnswer.map(ans => ans.toUpperCase()).join(', ') }}
            </span>
            <span v-else>{{ previewQuestionData.correctAnswer.toUpperCase() }}</span>
          </div>
          <div class="preview-explanation">
            <strong>解析：</strong>
            <span>{{ previewQuestionData.explanation || '暂无解析' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useQuestionStore } from '../stores/questionStore';

const questionStore = useQuestionStore();
const searchQuery = ref('');
const typeFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const previewDialogVisible = ref(false);
const previewQuestionData = ref(null);

// 题目数据
const questions = ref([]);

// 题目统计
const questionStats = computed(() => {
  const stats = {
    total: 0,
    singleChoice: 0,
    multipleChoice: 0,
    trueFalse: 0,
    easy: 0,
    medium: 0,
    hard: 0
  };
  
  questions.value.forEach(question => {
    stats.total++;
    stats[question.type]++;
    stats[question.difficulty]++;
  });
  
  return stats;
});

// 筛选后的题目
const filteredQuestions = computed(() => {
  let result = questions.value;
  
  // 按题型筛选
  if (typeFilter.value) {
    result = result.filter(q => q.type === typeFilter.value);
  }
  
  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(q => 
      q.question.toLowerCase().includes(query) ||
      q.options.some(opt => opt.text.toLowerCase().includes(query)) ||
      q.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  return result;
});

// 分页后的题目
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredQuestions.value.slice(start, end);
});

// 获取题型标签
const getTypeTag = (type) => {
  switch (type) {
    case 'singleChoice':
      return { type: 'primary', label: '单选题' };
    case 'multipleChoice':
      return { type: 'success', label: '多选题' };
    case 'trueFalse':
      return { type: 'warning', label: '判断题' };
    default:
      return { type: 'info', label: '未知' };
  }
};

// 获取难度标签
const getDifficultyTag = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return { type: 'success', label: '简单' };
    case 'medium':
      return { type: 'warning', label: '中等' };
    case 'hard':
      return { type: 'danger', label: '困难' };
    default:
      return { type: 'info', label: '未知' };
  }
};

// 筛选题目
const filterQuestions = () => {
  currentPage.value = 1;
};

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

// 预览题目
const previewQuestion = (question) => {
  previewQuestionData.value = question;
  previewDialogVisible.value = true;
};

// 加载题库数据
const loadQuestionsData = async () => {
  try {
    // 直接读取 questions.json 文件
    const response = await fetch('/questions.json');
    if (!response.ok) {
      throw new Error('Failed to load questions data');
    }
    
    const data = await response.json();
    
    // 转换数据格式
    questions.value = [];
    
    // 处理单选题
    if (data.categories.singleChoice) {
      data.categories.singleChoice.questions.forEach(q => {
        questions.value.push({
          ...q,
          type: 'singleChoice'
        });
      });
    }
    
    // 处理多选题
    if (data.categories.multipleChoice) {
      data.categories.multipleChoice.questions.forEach(q => {
        questions.value.push({
          ...q,
          type: 'multipleChoice'
        });
      });
    }
    
    // 处理判断题
    if (data.categories.trueFalse) {
      data.categories.trueFalse.questions.forEach(q => {
        questions.value.push({
          ...q,
          type: 'trueFalse'
        });
      });
    }
    
    ElMessage.success('题库数据加载成功');
  } catch (error) {
    console.error('Error loading questions data:', error);
    ElMessage.error('题库数据加载失败');
  }
};

onMounted(() => {
  loadQuestionsData();
});
</script>

<style scoped>
.question-bank-viewer {
  margin: 20px 0;
}

.viewer-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.question-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  margin-top: 5px;
  color: #606266;
}

.question-list {
  margin-top: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.question-item {
  margin-bottom: 15px;
}

.question-card {
  transition: all 0.3s ease;
}

.question-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-id {
  color: #909399;
  font-size: 12px;
}

.question-content h4 {
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.question-options {
  margin-bottom: 15px;
}

.option-item {
  margin: 8px 0;
  display: flex;
  align-items: flex-start;
}

.option-label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 20px;
}

.option-text {
  flex: 1;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.correct-answer {
  color: #67c23a;
  font-weight: bold;
}

.question-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.preview-dialog .preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.preview-id {
  color: #909399;
  font-size: 14px;
}

.preview-content h3 {
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.preview-options {
  margin-bottom: 20px;
}

.preview-option {
  margin: 10px 0;
  display: flex;
  align-items: flex-start;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.preview-option .option-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 25px;
}

.preview-footer {
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.preview-answer {
  margin-bottom: 10px;
  color: #67c23a;
  font-weight: bold;
}

.preview-explanation {
  line-height: 1.5;
}
</style>