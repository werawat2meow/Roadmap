"use client";

import {
  Col,
  Form,
  Input,
  Row,
  Select,
} from "antd";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

function getApiMessage(
  result,
  fallback
) {
  return (
    result?.message ||
    result?.error ||
    fallback
  );
}

async function readJsonResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const text =
      await response.text();

    throw new Error(
      `API ตอบกลับไม่ใช่ JSON (${response.status}): ${text.slice(
        0,
        100
      )}`
    );
  }

  return response.json();
}

function makeGeoOption(item) {
  return {
    value: String(item.code),
    label: item.name_en
      ? `${item.name_th} (${item.name_en})`
      : item.name_th,
    item,
  };
}

export default function EmployeeBirthPlaceSelector({
  form,
  disabled = false,
}) {
  const provinceCode =
    Form.useWatch(
      "birth_province_code",
      form
    );

  const districtCode =
    Form.useWatch(
      "birth_district_code",
      form
    );

  const [
    provinces,
    setProvinces,
  ] = useState([]);

  const [
    districts,
    setDistricts,
  ] = useState([]);

  const [
    subdistricts,
    setSubdistricts,
  ] = useState([]);

  const [
    provinceLoading,
    setProvinceLoading,
  ] = useState(false);

  const [
    districtLoading,
    setDistrictLoading,
  ] = useState(false);

  const [
    subdistrictLoading,
    setSubdistrictLoading,
  ] = useState(false);

  const provinceTimerRef =
    useRef(null);

  const fetchProvinces =
    useCallback(
      async (search = "") => {
        setProvinceLoading(true);

        try {
          const params =
            new URLSearchParams();

          params.set(
            "page",
            "1"
          );

          params.set(
            "pageSize",
            "77"
          );

          if (search.trim()) {
            params.set(
              "search",
              search.trim()
            );
          }

          const response =
            await fetch(
              `/api/admin/geothai/provinces?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                result,
                "ไม่สามารถโหลดจังหวัดได้"
              )
            );
          }

          setProvinces(
            Array.isArray(
              result?.data
            )
              ? result.data
              : []
          );
        } catch (error) {
          console.error(
            "fetchProvinces error:",
            error
          );

          setProvinces([]);
        } finally {
          setProvinceLoading(false);
        }
      },
      []
    );

  const fetchDistricts =
    useCallback(
      async (nextProvinceCode) => {
        if (!nextProvinceCode) {
          setDistricts([]);
          return;
        }

        setDistrictLoading(true);

        try {
          const response =
            await fetch(
              `/api/admin/geothai/districts?province_code=${encodeURIComponent(
                nextProvinceCode
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                result,
                "ไม่สามารถโหลดอำเภอได้"
              )
            );
          }

          setDistricts(
            Array.isArray(
              result?.data
            )
              ? result.data
              : []
          );
        } catch (error) {
          console.error(
            "fetchDistricts error:",
            error
          );

          setDistricts([]);
        } finally {
          setDistrictLoading(false);
        }
      },
      []
    );

  const fetchSubdistricts =
    useCallback(
      async (nextDistrictCode) => {
        if (!nextDistrictCode) {
          setSubdistricts([]);
          return;
        }

        setSubdistrictLoading(
          true
        );

        try {
          const response =
            await fetch(
              `/api/admin/geothai/subdistricts?district_code=${encodeURIComponent(
                nextDistrictCode
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                result,
                "ไม่สามารถโหลดตำบลได้"
              )
            );
          }

          setSubdistricts(
            Array.isArray(
              result?.data
            )
              ? result.data
              : []
          );
        } catch (error) {
          console.error(
            "fetchSubdistricts error:",
            error
          );

          setSubdistricts([]);
        } finally {
          setSubdistrictLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    fetchProvinces();

    return () => {
      if (
        provinceTimerRef.current
      ) {
        clearTimeout(
          provinceTimerRef.current
        );
      }
    };
  }, [fetchProvinces]);

  useEffect(() => {
    if (provinceCode) {
      fetchDistricts(
        provinceCode
      );
    }
  }, [
    provinceCode,
    fetchDistricts,
  ]);

  useEffect(() => {
    if (districtCode) {
      fetchSubdistricts(
        districtCode
      );
    }
  }, [
    districtCode,
    fetchSubdistricts,
  ]);

  return (
    <Row gutter={[16, 0]}>
      <Col
        xs={24}
        md={6}
      >
        <Form.Item
          label="จังหวัดเกิด"
          name="birth_province_code"
        >
          <Select
            showSearch
            allowClear
            filterOption={false}
            disabled={disabled}
            loading={
              provinceLoading
            }
            placeholder="เลือกจังหวัด"
            options={provinces.map(
              makeGeoOption
            )}
            onSearch={(value) => {
              if (
                provinceTimerRef.current
              ) {
                clearTimeout(
                  provinceTimerRef.current
                );
              }

              provinceTimerRef.current =
                setTimeout(() => {
                  fetchProvinces(
                    value
                  );
                }, 300);
            }}
            onChange={() => {
              form.setFieldsValue({
                birth_district_code:
                  undefined,

                birth_subdistrict_code:
                  undefined,

                birth_postcode: "",
              });

              setDistricts([]);
              setSubdistricts([]);
            }}
          />
        </Form.Item>
      </Col>

      <Col
        xs={24}
        md={6}
      >
        <Form.Item
          label="อำเภอ / เขตเกิด"
          name="birth_district_code"
        >
          <Select
            showSearch
            allowClear
            optionFilterProp="label"
            disabled={
              disabled ||
              !provinceCode
            }
            loading={
              districtLoading
            }
            placeholder={
              provinceCode
                ? "เลือกอำเภอ / เขต"
                : "เลือกจังหวัดก่อน"
            }
            options={districts.map(
              makeGeoOption
            )}
            onChange={() => {
              form.setFieldsValue({
                birth_subdistrict_code:
                  undefined,

                birth_postcode: "",
              });

              setSubdistricts([]);
            }}
          />
        </Form.Item>
      </Col>

      <Col
        xs={24}
        md={6}
      >
        <Form.Item
          label="ตำบล / แขวงเกิด"
          name="birth_subdistrict_code"
        >
          <Select
            showSearch
            allowClear
            optionFilterProp="label"
            disabled={
              disabled ||
              !districtCode
            }
            loading={
              subdistrictLoading
            }
            placeholder={
              districtCode
                ? "เลือกตำบล / แขวง"
                : "เลือกอำเภอก่อน"
            }
            options={subdistricts.map(
              makeGeoOption
            )}
            onChange={(
              value,
              option
            ) => {
              form.setFieldValue(
                "birth_postcode",
                option?.item
                  ?.postcode || ""
              );
            }}
          />
        </Form.Item>
      </Col>

      <Col
        xs={24}
        md={6}
      >
        <Form.Item
          label="รหัสไปรษณีย์"
          name="birth_postcode"
        >
          <Input
            disabled
            placeholder="รหัสไปรษณีย์"
          />
        </Form.Item>
      </Col>

      <Col xs={24}>
        <Form.Item
          label="รายละเอียดสถานที่เกิด"
          name="birth_place"
        >
          <Input
            disabled={disabled}
            placeholder="เช่น โรงพยาบาล หรือรายละเอียดเพิ่มเติม"
          />
        </Form.Item>
      </Col>
    </Row>
  );
}