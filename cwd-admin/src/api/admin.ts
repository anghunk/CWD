import { get, post, put, del } from './http';

export type AdminLoginResponse = {
	data: {
		key: string;
	};
};

export type CommentItem = {
	id: number;
	created: number;
	name: string;
	email: string;
	avatar: string;
	postSlug: string;
	url: string | null;
	ipAddress: string | null;
	contentText: string;
	contentHtml: string;
	status: string;
	priority?: number;
	ua?: string | null;
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
	allowedDomains?: string[];
	adminKey?: string | null;
	adminKeySet?: boolean;
	requireReview?: boolean;
	blockedIps?: string[];
	blockedEmails?: string[];
};

export type EmailNotifySettingsResponse = {
	globalEnabled: boolean;
	smtp?: {
		host: string;
		port: number;
		user: string;
		pass: string;
		secure: boolean;
	};
	templates?: {
		reply?: string;
		admin?: string;
	};
};

export type CommentStatsResponse = {
	summary: {
		total: number;
		approved: number;
		pending: number;
		rejected: number;
	};
	domains: {
		domain: string;
		total: number;
		approved: number;
		pending: number;
		rejected: number;
	}[];
	last7Days: {
		date: string;
		total: number;
	}[];
};

export type VisitOverviewResponse = {
	totalPv: number;
	totalPages: number;
	last30Days?: {
		date: string;
		total: number;
	}[];
};

export type VisitPageItem = {
	postSlug: string;
	postTitle: string | null;
	postUrl: string | null;
	pv: number;
	lastVisitAt: number | null;
};

export type VisitPagesResponse = {
	items: VisitPageItem[];
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

export function fetchComments(page: number, domain?: string): Promise<CommentListResponse> {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(page));
	if (domain) {
		searchParams.set('domain', domain);
	}
	return get<CommentListResponse>(`/admin/comments/list?${searchParams.toString()}`);
}

export function deleteComment(id: number): Promise<{ message: string }> {
	return del<{ message: string }>(`/admin/comments/delete?id=${id}`);
}

export function updateCommentStatus(id: number, status: string): Promise<{ message: string }> {
	return put<{ message: string }>(`/admin/comments/status?id=${id}&status=${encodeURIComponent(status)}`);
}

export function updateComment(data: {
	id: number;
	name: string;
	email: string;
	url?: string | null;
	postSlug?: string;
	contentText: string;
	status?: string;
	priority?: number;
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/comments/update', {
		id: data.id,
		name: data.name,
		email: data.email,
		url: data.url ?? null,
		postSlug: data.postSlug,
		content: data.contentText,
		status: data.status,
		priority: data.priority
	});
}

export function fetchAdminEmail(): Promise<AdminEmailResponse> {
	return get<AdminEmailResponse>('/admin/settings/email');
}

export function saveAdminEmail(email: string): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/email', { email });
}

export function fetchEmailNotifySettings(): Promise<EmailNotifySettingsResponse> {
	return get<EmailNotifySettingsResponse>('/admin/settings/email-notify');
}

export function saveEmailNotifySettings(data: {
	globalEnabled?: boolean;
	smtp?: {
		host?: string;
		port?: number;
		user?: string;
		pass?: string;
		secure?: boolean;
	};
	templates?: {
		reply?: string;
		admin?: string;
	};
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/email-notify', data);
}

export function sendTestEmail(data: {
	toEmail: string;
	smtp?: {
		host?: string;
		port?: number;
		user?: string;
		pass?: string;
		secure?: boolean;
	};
}): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/settings/email-test', data);
}

export function fetchCommentSettings(): Promise<CommentSettingsResponse> {
	return get<CommentSettingsResponse>('/admin/settings/comments');
}

export function saveCommentSettings(data: {
	adminEmail?: string;
	adminBadge?: string;
	avatarPrefix?: string;
	adminEnabled?: boolean;
	allowedDomains?: string[];
	adminKey?: string;
	requireReview?: boolean;
	blockedIps?: string[];
	blockedEmails?: string[];
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/comments', data);
}

export function blockIp(ip: string): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/comments/block-ip', { ip });
}

export function blockEmail(email: string): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/comments/block-email', { email });
}

export function exportComments(): Promise<any[]> {
	return get<any[]>('/admin/comments/export');
}

export function importComments(data: any[]): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/comments/import', data);
}

export function fetchCommentStats(domain?: string): Promise<CommentStatsResponse> {
	const searchParams = new URLSearchParams();
	if (domain) {
		searchParams.set('domain', domain);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/stats/comments?${query}` : '/admin/stats/comments';
	return get<CommentStatsResponse>(url);
}

export function fetchVisitOverview(domain?: string): Promise<VisitOverviewResponse> {
	const searchParams = new URLSearchParams();
	if (domain) {
		searchParams.set('domain', domain);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/analytics/overview?${query}` : '/admin/analytics/overview';
	return get<VisitOverviewResponse>(url);
}

export function fetchVisitPages(domain?: string): Promise<VisitPagesResponse> {
	const searchParams = new URLSearchParams();
	if (domain) {
		searchParams.set('domain', domain);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/analytics/pages?${query}` : '/admin/analytics/pages';
	return get<VisitPagesResponse>(url);
}
