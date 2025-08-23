<template>
  <div class="question-uploader">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>题库导入</span>
        </div>
      </template>
      
      <div class="upload-actions">
        <el-upload
          class="upload-area"
          drag
          action="http://localhost:3000/api/questions/upload"
          :before-upload="beforeUpload"
          :on-success="handleSuccess"
          :on-error="handleError"
          :file-list="fileList"
          accept=".json,.csv,.xlsx,.xls"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将题库文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持JSON、CSV、Excel文件格式
            </div>
          </template>
        </el-upload>
        
        <div class="clear-section">
          <el-button
            type="danger"
            @click="clearQuestions"
            :loading="clearing"
          >
            一键清空题库
          </el-button>
          <p class="clear-tip">注意：此操作将删除所有题目，且无法恢复</p>
        </div>
      </div>
      
      <div class="upload-result" v-if="uploadResult">
        <h4>导入报告</h4>
        <el-alert
          :title="uploadResult.message"
          :type="uploadResult.errorCount === 0 ? 'success' : 'warning'"
          show-icon
          :closable="false"
        >
        </el-alert>
        <div v-if="uploadResult.errorCount > 0" class="error-details">
          <h5>错误详情：</h5>
          <el-table :data="uploadResult.errors" style="width: 100%" height="250">
            <el-table-column prop="row" label="行号" width="100" />
            <el-table-column prop="question" label="题目" />
            <el-table-column prop="error" label="错误原因" />
          </el-table>
        </div>
      </div>

      <div class="format-info">
        <h4>题库格式说明：</h4>
        <el-collapse>
          <el-collapse-item title="表格格式示例（CSV/Excel）" name="1">
            <div class="table-example">
              <p>请按照以下格式准备数据，无需包含表头：</p>
              <table class="format-table">
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>单选题</td>
                    <td>中国的首都是哪个城市？</td>
                    <td>上海</td>
                    <td>北京</td>
                    <td>广州</td>
                    <td>深圳</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>B</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>多选题</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>A,B,C</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const fileList = ref([]);
const uploadResult = ref(null);
const clearing = ref(false);

const beforeUpload = (file) => {
  uploadResult.value = null; // 重置上传结果
  const isJSON = file.type === 'application/json' || file.name.endsWith('.json');
  const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.endsWith('.xlsx') ||
                 file.name.endsWith('.xls');
  
  if (!isJSON && !isCSV && !isExcel) {
    ElMessage.error('只能上传JSON、CSV或Excel文件!');
    return false;
  }
  return true;
};

const handleSuccess = (response) => {
  if (response.success) {
    uploadResult.value = {
      message: response.message,
      successCount: response.data.successCount,
      errorCount: response.data.errorCount,
      errors: response.data.errors
    };
    if (response.data.errorCount > 0) {
      ElMessage.warning('导入完成，但部分数据存在问题。');
    } else {
      ElMessage.success('题库导入成功!');
    }
  } else {
    ElMessage.error(response.message || '题库导入失败');
  }
  fileList.value = [];
};

const handleError = () => {
  ElMessage.error('上传失败，请检查网络或联系管理员');
  fileList.value = [];
};

const clearQuestions = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '确定要清空所有题目吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    clearing.value = true;
    
    const response = await fetch('http://localhost:3000/api/questions/clear', {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (result.success) {
      ElMessage.success('题库已清空');
      uploadResult.value = {
        message: result.message,
        successCount: 0,
        errorCount: 0,
        errors: []
      };
    } else {
      ElMessage.error(result.message || '清空题库失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error clearing questions:', error);
      ElMessage.error('清空题库失败，请重试');
    }
  } finally {
    clearing.value = false;
  }
};
</script>

<style scoped>
.question-uploader {
  margin: 20px 0;
}

.upload-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.upload-actions {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.upload-area {
  margin: 20px 0;
  flex: 1;
}

.clear-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #fef0f0;
  min-width: 200px;
}

.clear-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #f56c6c;
  text-align: center;
}

.format-info {
  margin-top: 20px;
}

.json-example {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.format-requirements {
  padding-left: 20px;
}

.format-requirements li {
  margin: 8px 0;
  line-height: 1.5;
}

.format-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 14px;
}

.format-table th,
.format-table td {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.format-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.format-table tr:nth-child(even) {
  background-color: #fafafa;
}
</style>