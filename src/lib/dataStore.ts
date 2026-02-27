import { create } from 'zustand';
import { supabase } from './supabase';

export interface Exam {
    id: string;
    title: string;
    description: string;
    duration: string;
    status: 'Aktif' | 'Selesai';
    dueDate: string;
    imageUrl?: string;
}

export interface Submission {
    id: string;
    studentName: string;
    nis: string;
    examId: string;
    examTitle: string;
    submitTime: string;
    status: 'pending' | 'graded';
    score: number | null;
    onshapeLink: string;
    isLate?: boolean;
    criteria?: {
        dimension: number;
        efficiency: number;
        aesthetics: number;
    };
    feedback?: string;
}

interface AppState {
    exams: Exam[];
    submissions: Submission[];
    isLoading: boolean;
    fetchExams: () => Promise<void>;
    fetchSubmissions: () => Promise<void>;
    addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
    updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
    deleteExam: (id: string) => Promise<void>;
    addSubmission: (submission: Omit<Submission, 'id'>) => Promise<void>;
    updateSubmission: (id: string, submission: Partial<Submission>) => Promise<void>;
    deleteSubmission: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    exams: [],
    submissions: [],
    isLoading: false,

    fetchExams: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching exams:', error);
        } else {
            const mappedExams: Exam[] = (data || []).map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                duration: item.duration,
                status: item.status,
                dueDate: item.due_date,
                imageUrl: item.image_url
            }));
            set({ exams: mappedExams });
        }
        set({ isLoading: false });
    },

    fetchSubmissions: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .order('submit_time', { ascending: false });

        if (error) {
            console.error('Error fetching submissions:', error);
        } else {
            const mappedSubmissions: Submission[] = (data || []).map(item => ({
                id: item.id,
                studentName: item.student_name,
                nis: item.nis,
                examId: item.exam_id,
                examTitle: item.exam_title,
                submitTime: item.submit_time,
                status: item.status,
                score: item.score,
                onshapeLink: item.onshape_link,
                isLate: item.is_late,
                criteria: item.criteria,
                feedback: item.feedback
            }));
            set({ submissions: mappedSubmissions });
        }
        set({ isLoading: false });
    },

    addExam: async (exam) => {
        const { error } = await supabase
            .from('exams')
            .insert([{
                title: exam.title,
                description: exam.description,
                duration: exam.duration,
                status: exam.status,
                due_date: exam.dueDate,
                image_url: exam.imageUrl
            }]);

        if (error) console.error('Error adding exam:', error);
        else await get().fetchExams();
    },

    updateExam: async (id, updatedFields) => {
        const mappedFields: Partial<Record<string, string | null>> = {};
        if (updatedFields.title) mappedFields.title = updatedFields.title;
        if (updatedFields.description) mappedFields.description = updatedFields.description;
        if (updatedFields.duration) mappedFields.duration = updatedFields.duration;
        if (updatedFields.status) mappedFields.status = updatedFields.status;
        if (updatedFields.dueDate) mappedFields.due_date = updatedFields.dueDate;
        if (updatedFields.imageUrl) mappedFields.image_url = updatedFields.imageUrl;

        const { error } = await supabase
            .from('exams')
            .update(mappedFields)
            .eq('id', id);

        if (error) console.error('Error updating exam:', error);
        else await get().fetchExams();
    },

    deleteExam: async (id) => {
        const { error } = await supabase
            .from('exams')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting exam:', error);
        else await get().fetchExams();
    },

    addSubmission: async (submission) => {
        const { error } = await supabase
            .from('submissions')
            .insert([{
                student_name: submission.studentName,
                nis: submission.nis,
                exam_id: submission.examId,
                exam_title: submission.examTitle,
                status: submission.status,
                score: submission.score,
                onshape_link: submission.onshapeLink,
                is_late: submission.isLate || false,
                criteria: submission.criteria,
                feedback: submission.feedback
            }]);

        if (error) console.error('Error adding submission:', error);
        else await get().fetchSubmissions();
    },

    updateSubmission: async (id, updatedFields) => {
        const mappedFields: Record<string, unknown> = {};
        if (updatedFields.status) mappedFields.status = updatedFields.status;
        if (updatedFields.score !== undefined) mappedFields.score = updatedFields.score;
        if (updatedFields.onshapeLink) mappedFields.onshape_link = updatedFields.onshapeLink;
        if (updatedFields.isLate !== undefined) mappedFields.is_late = updatedFields.isLate;
        if (updatedFields.criteria) mappedFields.criteria = updatedFields.criteria;
        if (updatedFields.feedback) mappedFields.feedback = updatedFields.feedback;

        const { error } = await supabase
            .from('submissions')
            .update(mappedFields)
            .eq('id', id);

        if (error) console.error('Error updating submission:', error);
        else await get().fetchSubmissions();
    },
    deleteSubmission: async (id) => {
        const { error } = await supabase
            .from('submissions')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting submission:', error);
        else await get().fetchSubmissions();
    }
}));
