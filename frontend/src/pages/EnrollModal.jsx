import React, { useState } from "react";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./Courses.module.css";

const EnrollModal = ({ show, onHide, course, onEnrollSuccess, showAlert }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Coupon validation + lock logic (apply coupon)
  const validateCoupon = async () => {
    if (!couponCode.trim() || !course) {
      setValidatedCoupon(null);
      return;
    }

    setCouponLoading(true);
    try {
      const totalAmount = course.discountedPrice || course.price;

      // 🔸 use apply API (locks coupon if valid)
      const response = await axios.post(
        "/api/coupons/apply",
        {
          code: couponCode,
          totalAmount: totalAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setValidatedCoupon(response.data);
      showAlert("Coupon applied successfully!", "success");
    } catch (error) {
      setValidatedCoupon(null);
      showAlert(
        error.response?.data?.message || "Invalid or already used coupon",
        "danger"
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // ✅ Enrollment logic
  const handleEnrollConfirm = async () => {
    if (!course) return;

    setEnrolling(true);
    try {
      const finalPrice = calculateFinalPrice();

      // ✅ FREE ENROLLMENT
      if (isCourseFree(course) || finalPrice === 0) {
        await axios.post(
          "/api/enrollments",
          {
            courseId: course._id,
            couponCode: validatedCoupon?.coupon?.code || couponCode,
            finalAmount: finalPrice,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        showAlert("Enrolled successfully! Redirecting to course...", "success");
        onEnrollSuccess();

        setTimeout(() => {
          navigate(`/learning/${course._id}`);
        }, 1500);
      } else {
        // ✅ PAID ENROLLMENT
        if (process.env.NODE_ENV === "development") {
          // 🔸 simulate payment in development
          console.log("Local development: Simulating enrollment without payment");

          await axios.post(
            "/api/enrollments",
            {
              courseId: course._id,
              couponCode: validatedCoupon?.coupon?.code || couponCode,
              finalAmount: finalPrice,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          showAlert("Enrolled successfully! Redirecting to course...", "success");
          onEnrollSuccess();

          setTimeout(() => {
            navigate(`/learning/${course._id}`);
          }, 1500);
        } else {
          // 🔸 Razorpay payment flow in production
          const paymentResponse = await axios.post(
            "/api/payments/create-order",
            {
              courseId: course._id,
              couponCode: validatedCoupon?.coupon?.code || couponCode,
              finalAmount: finalPrice,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          const { order, payment } = paymentResponse.data;

          const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: payment.amount * 100,
            currency: payment.currency,
            name: "Trading Course Platform",
            description: course.title,
            order_id: order.id,
            handler: async function (response) {
              try {
                await axios.post(
                  "/api/payments/verify",
                  {
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    courseId: course._id,
                    couponCode: validatedCoupon?.coupon?.code || couponCode,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );

                showAlert("Enrollment successful! Redirecting to course...", "success");
                onEnrollSuccess();

                setTimeout(() => {
                  navigate(`/learning/${course._id}`);
                }, 2000);
              } catch (error) {
                console.error("Payment verification failed:", error);
                showAlert("Payment verification failed. Please contact support.", "danger");
              }
            },
            prefill: {
              name: user?.username || "",
              email: user?.email || "",
            },
            theme: {
              color: "#007bff",
            },
            modal: {
              ondismiss: function () {
                showAlert("Payment cancelled", "warning");
              },
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        }
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      showAlert(
        error.response?.data?.message || "Enrollment failed. Please try again.",
        "danger"
      );
    } finally {
      setEnrolling(false);
    }
  };

  // ✅ Helpers
  const isCourseFree = (course) => {
    if (!course) return false;
    return course.price === 0 || course.discountedPrice === 0;
  };

  const calculateFinalPrice = () => {
    if (!course) return 0;

    let price = course.discountedPrice || course.price;

    if (validatedCoupon && validatedCoupon.success) {
      price = validatedCoupon.finalAmount;
    }

    return Math.max(0, price);
  };

  const handleModalClose = () => {
    setCouponCode("");
    setValidatedCoupon(null);
    onHide();
  };

  if (!course) return null;

  return (
    <Modal show={show} onHide={handleModalClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Enroll in Course</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.enrollModalContent}>
          <div className={styles.courseInfo}>
            <h5>{course.title}</h5>
            <p className="text-muted">{course.instructor}</p>
          </div>

          <div className={styles.pricingSection}>
            <div className={styles.originalPriceLine}>
              <span>Course Price:</span>
              <span>
                ₹{course.discountedPrice || course.price}
              </span>
            </div>

            {validatedCoupon && validatedCoupon.success && (
              <div className={styles.couponDiscount}>
                <span>Coupon Discount:</span>
                <span className={styles.discountText}>
                  -₹{validatedCoupon.discountAmount.toFixed(2)}
                  {validatedCoupon.coupon.discountType === 'percentage' && 
                    ` (${validatedCoupon.coupon.discountValue}%)`
                  }
                </span>
              </div>
            )}

            <hr />
            
            <div className={styles.finalPrice}>
              <strong>Final Price:</strong>
              <strong>
                {calculateFinalPrice() === 0 ? (
                  <span className={styles.freePrice}>FREE</span>
                ) : (
                  `₹${calculateFinalPrice().toFixed(2)}`
                )}
              </strong>
            </div>
          </div>

          {!isCourseFree(course) && (
            <div className={styles.couponSection}>
              <Form.Group>
                <Form.Label>Have a coupon code?</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponLoading}
                  />
                  <Button
                    variant="outline-primary"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </InputGroup>
                {validatedCoupon && validatedCoupon.success && (
                  <Form.Text className="text-success">
                    ✅ Coupon applied successfully! You saved ₹{validatedCoupon.discountAmount.toFixed(2)}
                  </Form.Text>
                )}
                {validatedCoupon && !validatedCoupon.success && (
                  <Form.Text className="text-danger">
                    ❌ {validatedCoupon.message}
                  </Form.Text>
                )}
              </Form.Group>
            </div>
          )}

          <div className={styles.enrollBenefits}>
            <h6>What you'll get:</h6>
            <ul>
              <li>Lifetime access to course content</li>
              <li>Certificate of completion</li>
              <li>Q&A support</li>
              <li>Downloadable resources</li>
              <li>Mobile and TV access</li>
            </ul>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleModalClose}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleEnrollConfirm}
          disabled={enrolling || !course}
          className={styles.confirmEnrollBtn}
        >
          {enrolling ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : calculateFinalPrice() === 0 ? (
            "Enroll for Free"
          ) : (
            `Pay ₹${calculateFinalPrice().toFixed(2)}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnrollModal;
