export declare class UpdateHotelAdminDto {
    name?: string;
    hotelCode?: string;
    contactPerson?: string;
    email?: string;
    mobile?: string;
    address?: string;
    gstNumber?: string;
    phoneNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    timezone?: string;
    country?: string;
    plan?: string;
    billingCycle?: string;
    status?: string;
    suspensionReason?: string;
}
export declare class CreateHotelUserDto {
    email: string;
    name: string;
    role: string;
    password: string;
    phone?: string;
    forcePasswordChange?: boolean;
}
