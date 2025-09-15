// src/components/UserForm/UserForm.tsx
import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Toast,
  ToastContainer,
} from "react-bootstrap";

const timeZones: { label: string; value: string }[] = [
  { label: "Eastern Time (ET)", value: "America/New_York" },
  { label: "Central Time (CT)", value: "America/Chicago" },
  { label: "Mountain Time (MT)", value: "America/Denver" },
  { label: "Pacific Time (PT)", value: "America/Los_Angeles" },
  { label: "UTC", value: "UTC" },
];

const UserForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interruptMinutes, setInterruptMinutes] = useState<number>(20);
  const [timeZone, setTimeZone] = useState<string>("UTC");

  // Password (optional)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save toast
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const emailInvalid = useMemo(
    () => email.length > 0 && !/^\S+@\S+\.\S+$/.test(email),
    [email]
  );
  const passwordMismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (emailInvalid || passwordMismatch) return;

    const payload = {
      name,
      email,
      interruptMinutes,
      timeZone,
      ...(newPassword ? { newPassword } : {}),
    };

    console.log("Saving profile:", payload, avatarFile);
    setShowSaved(true);
  };

  const handleCancel = () => {
    setName("");
    setEmail("");
    setInterruptMinutes(20);
    setTimeZone("UTC");
    setNewPassword("");
    setConfirmPassword("");
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={9} xl={8}>
          <h2 className="mb-4">Account Settings</h2>

          <Form onSubmit={handleSubmit}>
            {/* Profile Card */}
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Row className="g-4 align-items-center">
                  <Col sm="auto" className="text-center">
                    <div
                      className="rounded-circle overflow-hidden border"
                      style={{ width: 96, height: 96 }}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                          <span className="text-muted">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 d-flex gap-2 justify-content-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload
                      </Button>
                      {avatarPreview && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          Remove
                        </Button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setAvatarFile(f);
                        }}
                      />
                    </div>
                  </Col>

                  <Col>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="name">
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="email">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            isInvalid={emailInvalid}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter a valid email address.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group controlId="interrupt">
                          <Form.Label>Interruption Frequency</Form.Label>
                          <Form.Range
                            min={5}
                            max={120}
                            step={5}
                            value={interruptMinutes}
                            onChange={(e) => setInterruptMinutes(parseInt(e.target.value, 10))}
                          />
                          <div className="d-flex align-items-center">
                            <small className="text-muted">5 min</small>
                            <div className="ms-auto" />
                            <small className="text-muted">120 min</small>
                          </div>
                          <InputGroup className="mt-2" hasValidation>
                            <InputGroup.Text>Every</InputGroup.Text>
                            <Form.Control
                              type="number"
                              min={5}
                              max={240}
                              step={5}
                              value={interruptMinutes}
                              onChange={(e) =>
                                setInterruptMinutes(
                                  Math.min(240, Math.max(5, parseInt(e.target.value || "5", 10)))
                                )
                              }
                              required
                            />
                            <InputGroup.Text>minutes</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group controlId="timezone">
                          <Form.Label>Time Zone</Form.Label>
                          <Form.Select
                            value={timeZone}
                            onChange={(e) => setTimeZone(e.target.value)}
                          >
                            {timeZones.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Password */}
            <Card className="mb-4 shadow-sm">
              <Card.Header>Change Password (optional)</Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="newPassword">
                      <Form.Label>New Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="confirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        isInvalid={passwordMismatch}
                      />
                      <Form.Control.Feedback type="invalid">
                        Passwords don’t match.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <div className="d-flex gap-2">
              <Button type="submit" variant="success">
                Save Changes
              </Button>
              <Button type="button" variant="outline-secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </Form>
        </Col>
      </Row>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          bg="success"
          onClose={() => setShowSaved(false)}
          show={showSaved}
          delay={2200}
          autohide
        >
          <Toast.Body className="text-white">Profile saved successfully.</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default UserForm;
