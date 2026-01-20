import { get, post, put, del } from './http';

export type AdminLoginResponse = {
	data: {
		key: string;
	};
};

export type CommentItem = {
	id: number;
	pubDate: string;
	author: string;
	email: string;
	avatar: string;
	postSlug: string;
	url: string | null;
	ipAddress: string | null;
	contentText: string;
	contentHtml: string;
	status: string;
};

export type CommentListResponse = {
	data: CommentItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
};

export type AdminEmailResponse = {
	email: string | null;
};

export type CommentSettingsResponse = {
	adminEmail: string | null;
	adminBadge: string | null;
	avatarPrefix: string | null;
	adminEnabled: boolean;
};

export async function loginAdmin(name: string, password: string): Promise<string> {
	const res = await post<AdminLoginResponse>('/admin/login', { name, password });
	const key = res.data.key;
	localStorage.setItem('cwd_admin_token', key);
	return key;
}

export function logoutAdmin(): void {
	localStorage.removeItem('cwd_admin_token');
}

export function fetchComments(page: number): Promise<CommentListResponse> {
	return get<CommentListResponse>(`/admin/comments/list?page=${page}`);
}

export function deleteComment(id: number): Promise<{ message: string }> {
	return del<{ message: string }>(`/admin/comments/delete?id=${id}`);
}

export function updateCommentStatus(id: number, status: string): Promise<{ message: string }> {
	return put<{ message: string }>(`/admin/comments/status?id=${id}&status=${encodeURIComponent(status)}`);
}

export function fetchAdminEmail(): Promise<AdminEmailResponse> {
	return get<AdminEmailResponse>('/admin/settings/email');
}

export function saveAdminEmail(email: string): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/email', { email });
}

export function fetchCommentSettings(): Promise<CommentSettingsResponse> {
	return get<CommentSettingsResponse>('/admin/settings/comments');
}

export function saveCommentSettings(data: {
	adminEmail?: string;
	adminBadge?: string;
	avatarPrefix?: string;
	adminEnabled?: boolean;
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/comments', data);
}
