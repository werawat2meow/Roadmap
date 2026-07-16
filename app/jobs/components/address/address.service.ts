export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface Province {
    code: number;
    name_th: string;
    name_en: string;
}

export interface District {
    code: number;
    province_code: number;
    name_th: string;
    name_en: string;
}

export interface SubDistrict {
    code: number;
    district_code: number;
    province_code: number;
    name_th: string;
    name_en: string;
    postal_code: number;
}

const API = "/jobs/api/geothai";

async function request<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        cache: "no-store",
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed");
    }

    return result.data;
}

/**
 * จังหวัดทั้งหมด
 */
export async function getProvinces(): Promise<Province[]> {
    return request<Province[]>(`${API}?type=province`);
}

/**
 * จังหวัดตามรหัส
 */
export async function getProvince(
    provinceCode: string
): Promise<Province> {
    return request<Province>(
        `${API}?type=province&id=${provinceCode}`
    );
}

/**
 * อำเภอตามจังหวัด
 */
export async function getDistricts(
    provinceCode: number
): Promise<District[]> {
    return request<District[]>(
        `${API}?type=district&provinceId=${provinceCode}`
    );
}

/**
 * อำเภอตามรหัส
 */
export async function getDistrict(
    districtCode: string
): Promise<District> {
    return request<District>(
        `${API}?type=district&id=${districtCode}`
    );
}

/**
 * ตำบลตามอำเภอ
 */
export async function getSubDistricts(
    districtCode: number
): Promise<SubDistrict[]> {
    return request<SubDistrict[]>(
        `${API}?type=subdistrict&districtId=${districtCode}`
    );
}

/**
 * ตำบลตามรหัส
 */
export async function getSubDistrict(
    subDistrictCode: string
): Promise<SubDistrict> {
    return request<SubDistrict>(
        `${API}?type=subdistrict&id=${subDistrictCode}`
    );
}