"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Card, Col, Row, Tag, Typography, message, Modal, Select } from "antd";
import AntIcon from '@/components/AntIcon';
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

// ---- Design tokens ----
const TOKENS = {
  ink: "#10182B",
  slate: "#5B6472",
  paper: "#F5F6FA",
  border: "#E8E9F1",
  gold: "#B8933F",
  goldLight: "#F6ECD3",
  goldDark: "#8E6E28",
  navy: "#0F2A43",
};

export default function InterviewCandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState(null);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedName, setSelectedName] = useState("");

  const loadData = async (reviewerId) => {
    const query = reviewerId ? `?reviewer_id=${reviewerId}` : "";
    const res = await fetch(`/recruitment/api/schedule_list${query}`);
    const result = await res.json();
    if (result.success) {
      setCandidates(result.data);
    }
  };

  const loadReviewers = async () => {
    const res = await fetch("/recruitment/api/schedule_list/reviewers");
    const result = await res.json();
    if (result.success) {
      setReviewers(result.data);
    }
  };

  useEffect(() => {
    loadData(selectedReviewer);
    loadReviewers();
  }, []);

  const handleShare = async (id) => {
    try {
      const res = await fetch(
        "/recruitment/api/schedule_list/candidate_share",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ application_id: id }),
        }
      );

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      const url = result.url;

      if (navigator.share) {
        await navigator.share({ title: "ข้อมูลผู้สมัคร", url });
      } else {
        await navigator.clipboard.writeText(url);
        message.success("คัดลอกลิงก์แล้ว");
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleReviewerChange = (value) => {
    setSelectedReviewer(value);
    loadData(value);
  };

  const handleOpenImage = (item) => {
    if (!item.profile_image_url) return;
    setSelectedImage(item.profile_image_url);
    setSelectedName(`${item.first_name} ${item.last_name}`);
    setLightboxOpen(true);
  };

  const handleCloseImage = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
    setSelectedName("");
  };

  return (
    <div
      style={{
        padding: "32px 24px",
        background: TOKENS.paper,
        minHeight: "100vh",
      }}
    >
      {/* Scoped styles for hover / signature effects */}
      <style>{`
        .candidate-card {
          position: relative;
          border-radius: 20px !important;
          border: 1px solid ${TOKENS.border} !important;
          overflow: hidden;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .candidate-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${TOKENS.gold}, ${TOKENS.goldLight}, ${TOKENS.gold});
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }
        .candidate-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 18px 34px rgba(16, 24, 43, 0.15);
            border-color: ${TOKENS.gold}55 !important;
          }
        .candidate-card:hover::before {
          transform: scaleX(1);
        }
        .candidate-avatar-ring {
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldLight});
          display: inline-flex;
          transition: box-shadow 0.28s ease;
        }
        .candidate-card:hover .candidate-avatar-ring {
          box-shadow: 0 0 0 6px ${TOKENS.goldLight}80;
        }
        .candidate-position-tag {
          border: none !important;
          background: ${TOKENS.goldLight} !important;
          color: ${TOKENS.goldDark} !important;
          font-weight: 600;
          padding: 3px 14px !important;
          border-radius: 999px !important;
          letter-spacing: 0.2px;
        }
        .candidate-btn-outline {
          border: 1px solid ${TOKENS.border} !important;
          color: ${TOKENS.navy} !important;
          font-weight: 500;
          border-radius: 10px !important;
        }
        .candidate-btn-outline:hover {
          border-color: ${TOKENS.navy} !important;
          color: ${TOKENS.navy} !important;
          background: #F8F9FC !important;
        }
        .candidate-btn-gold {
          border: none !important;
          border-radius: 10px !important;
          font-weight: 600;
          color: #FFFFFF !important;
          background: linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldDark}) !important;
          box-shadow: 0 4px 12px rgba(184, 147, 63, 0.35);
        }
        .candidate-btn-gold:hover {
          filter: brightness(1.05);
          box-shadow: 0 6px 16px rgba(184, 147, 63, 0.45);
        }
      `}</style>

      <Title level={2} style={{ color: TOKENS.ink, marginBottom: 28, fontWeight: 700 }}>
        ผู้เข้าสัมภาษณ์
      </Title>

      <Select
        allowClear
        placeholder="เลือกผู้ Reviewer"
        style={{ width: 260, marginBottom: 24 }}
        value={selectedReviewer}
        onChange={handleReviewerChange}
        options={reviewers.map((r) => ({
          value: r.id,
          label: `${r.first_name_th} ${r.last_name_th}`,
        }))}
      />

      <Row gutter={[24, 24]}>
        {candidates.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              className="candidate-card"
              style={{
                background: `
                  linear-gradient(180deg, rgba(15, 42, 67, 0.96) 0%, rgba(15, 42, 67, 0.85) 20%, rgba(15, 42, 67, 0) 53%),
                  radial-gradient(circle at 50% 0%, rgba(184, 147, 63, 0.35) 0%, rgba(184, 147, 63, 0) 55%),
                  #FFFFFF
                `,
              }}
              styles={{
                body: {
                  padding: "28px 20px 20px",
                  background: "transparent",
                },
              }}
            >
              <div style={{ textAlign: "center" }}>
                {/* Avatar with gold ring */}
                <div className="candidate-avatar-ring">
                  <Avatar
                    size={100}
                    src={item.profile_image_url}
                    icon={<AntIcon name="UserOutlined" />}
                    style={{
                      cursor: item.profile_image_url ? "pointer" : "default",
                      border: "3px solid #FFFFFF",
                    }}
                    onClick={() => handleOpenImage(item)}
                  />
                </div>

                <Title
                  level={4}
                  style={{ marginTop: 18, marginBottom: 6, color: TOKENS.ink, fontWeight: 700 }}
                >
                  {item.first_name} {item.last_name}
                </Title>

                <Tag className="candidate-position-tag">
                  {item.positions?.position_name}
                </Tag>

                <div
                  style={{
                    height: 1,
                    background: TOKENS.border,
                    margin: "20px 0 16px",
                  }}
                />

                <Row gutter={10}>
                  <Col span={12}>
                    <Button
                      block
                      className="candidate-btn-outline"
                      icon={<AntIcon name="EyeOutlined" />}
                      onClick={() => router.push(`/recruitment/schedule_list/${item.id}`)}
                    >
                      รายละเอียด
                    </Button>
                  </Col>

                  <Col span={12}>
                    <Button
                      block
                      className="candidate-btn-gold"
                      icon={<AntIcon name="ShareAltOutlined" />}
                      onClick={() => handleShare(item.id)}
                    >
                      แชร์
                    </Button>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Lightbox */}
      <Modal
        open={lightboxOpen}
        onCancel={handleCloseImage}
        footer={null}
        centered
        width={800}
        style={{ borderRadius: 18, overflow: "hidden" }}
        title={<Text style={{ fontWeight: 600, color: TOKENS.ink }}>{selectedName}</Text>}
        styles={{
          body: { padding: 0, textAlign: "center", background: "#0F1420" },
        }}
      >
        {selectedImage && (
          <img
            src={selectedImage}
            alt={selectedName}
            style={{
              display: "block",
              width: "100%",
              maxHeight: "75vh",
              objectFit: "contain",
              margin: "0 auto",
            }}
          />
        )}
      </Modal>
    </div>
  );
}