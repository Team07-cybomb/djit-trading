import React, { useState } from "react";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
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
  const [couponError, setCouponError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Fixed Coupon validation with better error handling
  const validateCoupon = async () => {
    if (!couponCode.trim() || !course) {
      setValidatedCoupon(null);
      setCouponError("");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    
    try {
      const totalAmount = parseFloat(course.discountedPrice || course.price);

      console.log('Sending coupon request:', {
        code: couponCode.trim().toUpperCase(),
        totalAmount: totalAmount
      });

      const response = await axios.post(
        "/api/coupons/apply",
        {
          code: couponCode.trim().toUpperCase(),
          totalAmount: totalAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log('Coupon response:', response.data);

      if (response.data.success) {
        setValidatedCoupon(response.data);
        setCouponError("");
        showAlert("Coupon applied successfully!", "success");
      } else {
        throw new Error(response.data.message || "Failed to apply coupon");
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      setValidatedCoupon(null);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Invalid or expired coupon";
      
      setCouponError(errorMessage);
      showAlert(errorMessage, "danger");
    } finally {
      setCouponLoading(false);
    }
  };

  // ✅ Fixed Enrollment logic
  const handleEnrollConfirm = async () => {
    if (!course) return;

    setEnrolling(true);
    try {
      const finalPrice = calculateFinalPrice();
      const appliedCouponCode = validatedCoupon?.coupon?.code || (couponCode.trim() ? couponCode.trim().toUpperCase() : undefined);

      console.log('Enrolling with:', {
        courseId: course._id,
        couponCode: appliedCouponCode,
        finalAmount: finalPrice
      });

      // ✅ FREE ENROLLMENT
      if (isCourseFree(course) || finalPrice === 0) {
        await axios.post(
          "/api/enrollments",
          {
            courseId: course._id,
            couponCode: appliedCouponCode,
            finalAmount: finalPrice,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
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
              couponCode: appliedCouponCode,
              finalAmount: finalPrice,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
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
              couponCode: appliedCouponCode,
              finalAmount: finalPrice,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
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
                    couponCode: appliedCouponCode,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                      "Content-Type": "application/json",
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

    let price = parseFloat(course.discountedPrice || course.price);

    if (validatedCoupon && validatedCoupon.success) {
      price = parseFloat(validatedCoupon.finalAmount);
    }

    return Math.max(0, price);
  };

  const handleModalClose = () => {
    setCouponCode("");
    setValidatedCoupon(null);
    setCouponError("");
    onHide();
  };

  const handleCouponCodeChange = (e) => {
    setCouponCode(e.target.value);
    // Reset validation when user changes the coupon code
    if (validatedCoupon || couponError) {
      setValidatedCoupon(null);
      setCouponError("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && couponCode.trim() && !couponLoading) {
      validateCoupon();
    }
  };

  if (!course) return null;

  const finalPrice = calculateFinalPrice();

  return (
    <Modal show={show} onHide={handleModalClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Enroll in Course</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.enrollModalContent}>
          <div className={styles.courseInfo}>
            <h5>{course.title}</h5>
            <p className="text-muted">by {course.instructor}</p>
          </div>

          <div className={styles.pricingSection}>
            <div className={styles.originalPriceLine}>
              <span>Course Price:</span>
              <span>
                ₹{(course.discountedPrice || course.price).toFixed(2)}
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
                {finalPrice === 0 ? (
                  <span className={styles.freePrice}>FREE</span>
                ) : (
                  `₹${finalPrice.toFixed(2)}`
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
                    onChange={handleCouponCodeChange}
                    onKeyPress={handleKeyPress}
                    disabled={couponLoading}
                    isInvalid={!!couponError}
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
                  <Form.Control.Feedback type="invalid">
                    {couponError}
                  </Form.Control.Feedback>
                </InputGroup>
                
                {validatedCoupon && validatedCoupon.success && (
                  <Form.Text className="text-success">
                    ✅ Coupon applied successfully! You saved ₹{validatedCoupon.discountAmount.toFixed(2)}
                  </Form.Text>
                )}
                
                {couponError && (
                  <Form.Text className="text-danger">
                    ❌ {couponError}
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
          disabled={enrolling}
        >
          Cancel
        </Button>
        <Button
          variant={finalPrice === 0 ? "success" : "primary"}
          onClick={handleEnrollConfirm}
          disabled={enrolling || !course}
          className={styles.confirmEnrollBtn}
        >
          {enrolling ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : finalPrice === 0 ? (
            "Enroll for Free"
          ) : (
            `Pay ₹${finalPrice.toFixed(2)}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnrollModal;