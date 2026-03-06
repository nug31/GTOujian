import { create } from 'zustand';
import { supabase } from './supabase';

export interface Exam {
    id: string;
    title: string;
    description: string;
    duration: string;
    status: 'Aktif' | 'Selesai';
    dueDate?: string;
    imageUrl?: string;
    targetClass?: string;
    isRemedial?: boolean;
    parentExamId?: string;
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
    tabSwitches?: number;
    studentClass?: string;
    criteria?: {
        dimension: number;
        efficiency: number;
        aesthetics: number;
    };
    feedback?: string;
}

export interface Student {
    id?: string;
    name: string;
    nisn: string;
    class: string;
}

interface AppState {
    exams: Exam[];
    submissions: Submission[];
    students: Student[];
    isLoading: boolean;
    fetchExams: () => Promise<void>;
    fetchSubmissions: () => Promise<void>;
    addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
    updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
    deleteExam: (id: string) => Promise<void>;
    addSubmission: (submission: Omit<Submission, 'id'>) => Promise<{ success: boolean; error?: string }>;
    updateSubmission: (id: string, submission: Partial<Submission>) => Promise<void>;
    deleteSubmission: (id: string) => Promise<void>;
    fetchAvailableClasses: () => Promise<{ data: string[] | null, error: any }>;
    subscribeSubmissions: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    exams: [],
    submissions: [],
    students: [],
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
                imageUrl: item.image_url,
                targetClass: item.target_class,
                isRemedial: item.is_remedial,
                parentExamId: item.parent_exam_id
            }));
            set({ exams: mappedExams });
        }
        set({ isLoading: false });
    },

    fetchSubmissions: async () => {
        set({ isLoading: true });
        const { data: subData, error: subError } = await supabase
            .from('submissions')
            .select('*')
            .order('submit_time', { ascending: false });

        const { data: stuData, error: stuError } = await supabase
            .from('students')
            .select('nisn, name, class');

        if (subError || stuError) {
            console.error('Error fetching data:', subError || stuError);
        } else {
            const mappedStudents: Student[] = (stuData || []).map(s => ({
                name: s.name,
                nisn: s.nisn,
                class: s.class
            }));

            const studentMap = new Map((stuData || []).map(s => [s.nisn, s.class]));
            const mappedSubmissions: Submission[] = (subData || []).map(item => ({
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
                tabSwitches: item.tab_switches,
                studentClass: studentMap.get(item.nis) || item.student_class,
                criteria: item.criteria,
                feedback: item.feedback
            }));
            set({ submissions: mappedSubmissions, students: mappedStudents });
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
                due_date: exam.dueDate || null,
                image_url: exam.imageUrl,
                target_class: exam.targetClass,
                is_remedial: exam.isRemedial || false,
                parent_exam_id: exam.parentExamId || null
            }]);

        if (error) console.error('Error adding exam:', error);
        else await get().fetchExams();
    },

    updateExam: async (id, updatedFields) => {
        const mappedFields: Record<string, any> = {};
        if (updatedFields.title) mappedFields.title = updatedFields.title;
        if (updatedFields.description) mappedFields.description = updatedFields.description;
        if (updatedFields.duration) mappedFields.duration = updatedFields.duration;
        if (updatedFields.status) mappedFields.status = updatedFields.status;
        if (updatedFields.dueDate !== undefined) mappedFields.due_date = updatedFields.dueDate || null;
        if (updatedFields.imageUrl) mappedFields.image_url = updatedFields.imageUrl;
        if (updatedFields.targetClass) mappedFields.target_class = updatedFields.targetClass;
        if (updatedFields.isRemedial !== undefined) mappedFields.is_remedial = updatedFields.isRemedial;
        if (updatedFields.parentExamId !== undefined) mappedFields.parent_exam_id = updatedFields.parentExamId || null;

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
        const trimmedNis = submission.nis.trim();
        console.log(`Attempting to add submission for NIS: ${trimmedNis}, Exam: ${submission.examId}`);

        const submissionData: any = {
            student_name: submission.studentName,
            nis: trimmedNis,
            exam_id: submission.examId,
            exam_title: submission.examTitle,
            status: submission.status,
            score: submission.score,
            onshape_link: submission.onshapeLink,
        };

        // Add optional/new columns dynamically based on presence
        // This prevents 'column not found' errors if schema isn't fully updated
        if (submission.studentClass) submissionData.student_class = submission.studentClass;
        if (submission.isLate !== undefined) submissionData.is_late = submission.isLate;
        if (submission.tabSwitches !== undefined) submissionData.tab_switches = submission.tabSwitches;
        if (submission.criteria) submissionData.criteria = submission.criteria;
        if (submission.feedback) submissionData.feedback = submission.feedback;

        const { error: insertError } = await supabase
            .from('submissions')
            .insert([submissionData]);

        if (insertError) {
            console.error('Error adding submission:', insertError);
            return { success: false, error: insertError.message };
        } else {
            console.log('Submission added successfully');
            await get().fetchSubmissions();
            return { success: true };
        }
    },

    updateSubmission: async (id, updatedFields) => {
        const mappedFields: Record<string, unknown> = {};
        if (updatedFields.status) mappedFields.status = updatedFields.status;
        if (updatedFields.score !== undefined) mappedFields.score = updatedFields.score;
        if (updatedFields.onshapeLink) mappedFields.onshape_link = updatedFields.onshapeLink;
        if (updatedFields.isLate !== undefined) mappedFields.is_late = updatedFields.isLate;
        if (updatedFields.tabSwitches !== undefined) mappedFields.tab_switches = updatedFields.tabSwitches;
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
    },
    fetchAvailableClasses: async () => {
        const { data, error } = await supabase
            .from('students')
            .select('class');

        if (error) {
            console.error('Error fetching classes:', error);
            return { data: null, error };
        }

        const uniqueClasses = Array.from(new Set(data.map(s => s.class))).sort();
        return { data: uniqueClasses, error: null };
    },

    subscribeSubmissions: () => {
        const channel = supabase
            .channel('submissions-changes')
            .on(
                'postgres_changes',
                { event: '*', table: 'submissions', schema: 'public' },
                () => {
                    get().fetchSubmissions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}));
