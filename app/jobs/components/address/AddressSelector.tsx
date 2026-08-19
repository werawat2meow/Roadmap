"use client";

import { useEffect, useState } from "react";
import { Col, Form, Input, Row, Select } from "antd";

import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";
import { useLanguage } from "@/contexts/LanguageContext";

import { AddressValue } from "@/app/jobs/types/types";

import {
    District,
    Province,
    SubDistrict,
    getDistricts,
    getProvinces,
    getSubDistricts,
} from "@/app/jobs/components/address/address.service";

interface Props {
    value: AddressValue;
    onChange: (value: AddressValue) => void;
}

export default function AddressSelector({
    value,
    onChange,
}: Props) {
    const { locale } = useLanguage();

    const [provinceOptions, setProvinceOptions] = useState<Province[]>([]);
    const [districtOptions, setDistrictOptions] = useState<District[]>([]);
    const [subDistrictOptions, setSubDistrictOptions] = useState<SubDistrict[]>([]);

    const [loadingProvince, setLoadingProvince] = useState(false);
    const [loadingDistrict, setLoadingDistrict] = useState(false);
    const [loadingSubDistrict, setLoadingSubDistrict] = useState(false);

    useEffect(() => {
        loadProvinces();
    }, []);

    useEffect(() => {
        if (value.provinceId) {
            loadDistricts(value.provinceId);
        } else {
            setDistrictOptions([]);
            setSubDistrictOptions([]);
        }
    }, [value.provinceId]);

    useEffect(() => {
        if (value.districtId) {
            loadSubDistricts(value.districtId);
        } else {
            setSubDistrictOptions([]);
        }
    }, [value.districtId]);

    async function loadProvinces() {
        try {
            setLoadingProvince(true);
            const data = await getProvinces();
            setProvinceOptions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProvince(false);
        }
    }

    async function loadDistricts(provinceCode: number) {
        try {
            setLoadingDistrict(true);
            const data = await getDistricts(provinceCode);
            setDistrictOptions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDistrict(false);
        }
    }

    async function loadSubDistricts(districtCode: number) {
        try {
            setLoadingSubDistrict(true);
            const data = await getSubDistricts(districtCode);
            setSubDistrictOptions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSubDistrict(false);
        }
    }

    async function handleProvinceChange(provinceCode?: number) {
        if (!provinceCode) {
            setDistrictOptions([]);
            setSubDistrictOptions([]);
            onChange({
                provinceId: undefined,
                districtId: undefined,
                subDistrictId: undefined,
                postalCode: "",
            });
            return;
        }
                
        await loadDistricts(provinceCode);
        setSubDistrictOptions([]);
        onChange({
            provinceId: provinceCode,
            districtId: undefined,
            subDistrictId: undefined,
            postalCode: "",
        });
    }

    async function handleDistrictChange(districtCode?: number) {
        if (!districtCode) {
            setSubDistrictOptions([]);
            onChange({
                ...value,
                districtId: undefined,
                subDistrictId: undefined,
                postalCode: "",
            });
            return;
        }      
        await loadSubDistricts(districtCode);
        onChange({
            ...value,
            districtId: districtCode,
            subDistrictId: undefined,
            postalCode: "",
        });
    }

    function handleSubDistrictChange(subDistrictCode?: number) {

        if (!subDistrictCode) {
            onChange({
                ...value,
                subDistrictId: undefined,
                postalCode: "",
            });
            return;
        }
        const selected = subDistrictOptions.find(
            item => item.code === subDistrictCode
        );
        onChange({
            ...value,
            subDistrictId: subDistrictCode,
            postalCode: String(selected?.postal_code ?? ""),
        });
    }

    return (
        <Row gutter={16}>
            {/* Province */}
            <Col xs={24} md={6}>
                <Form.Item
                    label={getUIText(uiText.province, locale)}
                    required
                >
                    <Select
                        value={value.provinceId}
                        loading={loadingProvince}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder={
                            locale === "TH"
                                ? "เลือกจังหวัด"
                                : "Select Province"
                        }
                        onChange={handleProvinceChange}
                        options={provinceOptions.map((item) => ({
                            value: item.code,
                            label:
                                locale === "TH"
                                    ? item.name_th
                                    : item.name_en,
                        }))}
                    />
                </Form.Item>
            </Col>

            {/* District */}
            <Col xs={24} md={6}>
                <Form.Item
                    label={getUIText(uiText.district, locale)}
                    required
                >
                    <Select
                        value={value.districtId}
                        loading={loadingDistrict}
                        allowClear
                        disabled={!value.provinceId}
                        showSearch
                        optionFilterProp="label"
                        placeholder={
                            locale === "TH"
                                ? "เลือกอำเภอ"
                                : "Select District"
                        }
                        onChange={handleDistrictChange}
                        options={districtOptions.map((item) => ({
                            value: item.code,
                            label:
                                locale === "TH"
                                    ? item.name_th
                                    : item.name_en,
                        }))}
                    />
                </Form.Item>
            </Col>

            {/* Sub District */}
            <Col xs={24} md={6}>
                <Form.Item
                    label={getUIText(uiText.subDistrict, locale)}
                    required
                >
                    <Select
                        
                        value={value.subDistrictId}
                        loading={loadingSubDistrict}
                        allowClear
                        disabled={!value.districtId}
                        showSearch
                        optionFilterProp="label"
                        placeholder={
                            locale === "TH"
                                ? "เลือกตำบล"
                                : "Select Sub District"
                        }
                        onChange={handleSubDistrictChange}
                        options={subDistrictOptions.map((item) => ({
                            value: item.code,
                            label:
                                locale === "TH"
                                    ? item.name_th
                                    : item.name_en,
                        }))}
                    />
                </Form.Item>
            </Col>

            {/* Postal Code */}
            <Col xs={24} md={6}>
                <Form.Item
                    label={getUIText(uiText.postalCode, locale)}
                    required
                >
                    <Input
                        value={value.postalCode}
                        readOnly
                        maxLength={5}
                        placeholder={
                            locale === "TH"
                                ? "กรอกอัตโนมัติจากตำบล"
                                : "Auto-filled from Sub District"
                        }
                    />
                </Form.Item>
            </Col>
        </Row>
    );
}