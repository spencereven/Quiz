import { defineStore } from 'pinia';

export const useQuestionStore = defineStore('question', {
  state: () => ({
    question: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchQuestion(type) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`/api/question?type=${type}`);
        if (!response.ok) {
          throw new Error('Failed to fetch question');
        }
        this.question = await response.json();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
  },
});