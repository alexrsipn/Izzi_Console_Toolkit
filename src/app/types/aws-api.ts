export interface GetToken {
    status: number;
    detail: string;
    token: string;
    refreshToken: string;
    expires: number;
}

export interface GetAvailableDates {
    dates: string[];
}