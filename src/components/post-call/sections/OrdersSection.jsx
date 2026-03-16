import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  Pencil,
  Loader2,
} from "lucide-react";
import {
  postDME,
  postImaging,
  postLab,
  postOther,
  postPatientInfo,
  postPrescription,
  postProcedure,
  postReferral,
  postVaccine,
} from "../../../api/orders";
import { useToast } from "../../../hooks/use-toast";

const normalizeOrderValue = (value) => String(value || "").trim().toLowerCase();

const getOrderLabel = (order = {}) =>
  order.selected_order_name ||
  order.clinical_intent ||
  order.name ||
  order.order_type ||
  "Order";

const getOrderPersistKey = (order = {}, index = 0) =>
  [
    normalizeOrderValue(order.selected_order_name || order.clinical_intent || order.name),
    normalizeOrderValue(order.order_type),
    normalizeOrderValue(order.priority),
    normalizeOrderValue(order.additional_instructions || order.notes),
    index,
  ].join("|");

const stripInternalOrderFields = (order = {}) => {
  const { __persistKey, ...rest } = order;
  return rest;
};

const PostIconButton = ({
  onClick,
  disabled,
  isPosted = false,
  isFailed = false,
  isPosting = false,
}) => {
  const [status, setStatus] = useState("idle");

  const handleClick = () => {
    if (status !== "idle" || disabled || isPosted || isPosting) return;

    onClick(
      () => {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      },
      () => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    );
  };

  let bgClass =
    "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400";
  let icon = <Send className="w-3.5 h-3.5" />;
  let label = null;

  if (isPosting) {
    bgClass = "bg-blue-50 text-blue-700 border-blue-200 w-auto px-2";
    icon = <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />;
    label = <span className="text-xs font-medium">Posting</span>;
  } else if (isPosted) {
    bgClass = "bg-green-50 text-green-700 border-green-200 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Posted</span>;
  } else if (isFailed) {
    bgClass = "bg-red-50 text-red-700 border-red-200 w-auto px-2";
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Failed</span>;
  } else if (disabled) {
    bgClass = "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed";
  } else if (status === "success") {
    bgClass = "bg-green-50 text-green-700 border-green-200 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Success</span>;
  } else if (status === "error") {
    bgClass = "bg-red-50 text-red-700 border-red-200 w-auto px-2";
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Failed</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || status !== "idle" || isPosted || isPosting}
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all ${bgClass} ${
        status === "idle" ? "w-7" : ""
      }`}
      title={
        isPosting
          ? "Posting to Athena"
          : isPosted
          ? "Already posted"
          : isFailed
          ? "Retry post"
          : "Post to Athena"
      }
    >
      {icon}
      {label}
    </button>
  );
};

const OrdersSection = ({
  ordersData,
  doctorEmail,
  encounterId,
  practiceId,
  appointmentId,
  canPostToAthena = true,
}) => {
  const { toast } = useToast();
  
  const emptyConfirmModal = {
    open: false,
    order: null,
    onSuccess: null,
    onError: null,
  };

  const [editableOrders, setEditableOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);
  const [postingOrderKeys, setPostingOrderKeys] = useState({});
  const [editingOrderIndexes, setEditingOrderIndexes] = useState({});
  const [advancedOrderIndexes, setAdvancedOrderIndexes] = useState({});
  const [confirmModal, setConfirmModal] = useState(emptyConfirmModal);

  const renderModal = (node) => {
    if (typeof document === "undefined") return null;
    return createPortal(node, document.body);
  };

  const markOrderPosted = (order) => {
  const orderKey = order?.__persistKey;
  if (!orderKey) return;

  setEditableOrders((prev) =>
    prev.map((o) =>
      o.__persistKey === orderKey ? { ...o, isPosted: true } : o
    )
  );
};

  useEffect(() => {
    const uniqueOrders = [];
    const seen = new Set();
    const incoming = ordersData?.orders || [];
    
    for (const [index, order] of incoming.entries()) {
      const orderName =
        order.selected_order_name || order.clinical_intent || order.name || "";
      const type = order.order_type || "";
      const key = `${orderName}-${type}`.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueOrders.push({
          ...order,
          __persistKey: getOrderPersistKey(order, index),
        });
      }
    }

    setEditableOrders(uniqueOrders);
    setOriginalOrders(uniqueOrders);
    setEditingOrderIndexes({});
    setAdvancedOrderIndexes({});
    setPostingOrderKeys({});
  }, [ordersData]);


  const isOrderPosted = (order) => order?.isPosted === true;
  const isOrderFailed = () => false;
  const isOrderPosting = (order) => Boolean(postingOrderKeys[order?.__persistKey]);

  const handleEditOrder = (index) => {
    const order = editableOrders[index];
    if (!order || isOrderPosted(order)) return;

    setEditingOrderIndexes((prev) => ({ ...prev, [index]: true }));
  };

  const handleCancelEdit = (index) => {
    const originalOrder = originalOrders[index];
    if (!originalOrder) return;

    setEditableOrders((prev) => {
      const next = [...prev];
      next[index] = originalOrder;
      return next;
    });

    setEditingOrderIndexes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    setAdvancedOrderIndexes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleDoneEdit = (index) => {
    setEditingOrderIndexes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleToggleAdvancedFields = (index) => {
    setAdvancedOrderIndexes((prev) => {
      const next = { ...prev };
      if (next[index]) {
        delete next[index];
      } else {
        next[index] = true;
      }
      return next;
    });
  };

  const handleEditField = (index, field, value) => {
    setEditableOrders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const clearOrderFailure = (index) => {
    const orderKey = editableOrders[index]?.__persistKey;
    if (!orderKey) return;
  };

  const clearOrderPosting = (order) => {
    const orderKey = order?.__persistKey;
    if (!orderKey) return;
    setPostingOrderKeys((prev) => {
      if (!prev[orderKey]) return prev;
      const next = { ...prev };
      delete next[orderKey];
      return next;
    });
  };

  const postOrder = async (order, doctorEmail, encounterId, practiceId, appointmentId) => {
    let res;
    const payload = stripInternalOrderFields(order);

    if (order.order_type === "Imaging") {
      res = await postImaging(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "Lab") {
      res = await postLab(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "Procedure") {
      res = await postProcedure(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "Other") {
      res = await postOther(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "Referral") {
      res = await postReferral(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "Vaccine") {
      res = await postVaccine(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "PatientInfo") {
      res = await postPatientInfo(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "Prescription") {
      res = await postPrescription(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else if (order.order_type === "DME") {
      res = await postDME(doctorEmail, encounterId, appointmentId, payload, practiceId);
    } else {
      throw new Error(`Unsupported order type: ${order.order_type}`);
    }

    if (!res) {
      throw new Error("Order post failed");
    }

    // API shape: { success: true/false, message: string }
    // Treat explicit success:false as a failure so callers enter the catch path
    if (res.success === false) {
      throw new Error(res.message || "Order post failed");
    }

    return res;
  };

  const showOrderFailureToast = (order, message) => {
    toast({
      title: `Failed to post ${getOrderLabel(order)}`,
      description: message || "Order post failed",
    });
  };

  const ConfirmModal = () => {
    if (!confirmModal.open) return null;
    const isConfirmPosting = isOrderPosting(confirmModal.order);

    return renderModal(
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 relative">
          <button
            onClick={() => setConfirmModal(emptyConfirmModal)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold mb-4">Confirm Post</h3>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-600">
              You are about to post{" "}
              <span className="font-semibold text-gray-900">
                {confirmModal.order?.selected_order_name ||
                  confirmModal.order?.clinical_intent ||
                  confirmModal.order?.name}
              </span>{" "}
              to Athena.
            </p>
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              This is a one-time post. Review the details carefully. After posting,
              this order cannot be edited in Seismic.
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmModal(emptyConfirmModal)}
              className="px-4 py-1 text-sm border rounded-md"
              disabled={isConfirmPosting}
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                const orderIndex = editableOrders.findIndex(
                  (item) => item === confirmModal.order
                );
                const orderKey = confirmModal.order?.__persistKey;

                try {
                  if (orderKey) {
                    setPostingOrderKeys((prev) => ({ ...prev, [orderKey]: true }));
                  }
                  await postOrder(
                    confirmModal.order,
                    doctorEmail,
                    encounterId,
                    practiceId,
                    appointmentId
                  );
                  markOrderPosted(confirmModal.order);
                  if (orderIndex !== -1) {
                    clearOrderFailure(orderIndex);
                    setEditingOrderIndexes((prev) => {
                      const next = { ...prev };
                      delete next[orderIndex];
                      return next;
                    });
                    setAdvancedOrderIndexes((prev) => {
                      const next = { ...prev };
                      delete next[orderIndex];
                      return next;
                    });
                  }
                  confirmModal.onSuccess?.();
                } catch (error) {
                  if (orderIndex !== -1) {
                    setEditingOrderIndexes((prev) => {
                      const next = { ...prev };
                      delete next[orderIndex];
                      return next;
                    });
                    setAdvancedOrderIndexes((prev) => {
                      const next = { ...prev };
                      delete next[orderIndex];
                      return next;
                    });
                  }
                  confirmModal.onError?.(error);
                  showOrderFailureToast(
                    confirmModal.order,
                    error?.message || "Order post failed"
                  );
                } finally {
                  clearOrderPosting(confirmModal.order);
                }

                setConfirmModal(emptyConfirmModal);
              }}
              className="px-4 py-1 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
              disabled={isConfirmPosting}
            >
              {isConfirmPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const readOnlyMessage = canPostToAthena
    ? "Review any order before its one-time Athena post."
    : "Orders are read-only in Seismic.";

  return (
    <div className="space-y-6 text-gray-900 leading-snug">
      <div className="pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-black text-lg">Clinical Orders</h3>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>{readOnlyMessage}</div>
          <div className="text-xs text-blue-700">
            Use Review/Edit to make changes before posting to Athena.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {editableOrders.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">
            No orders associated with this encounter.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {editableOrders.map((item, index) => {
              const isEditing = Boolean(editingOrderIndexes[index]);
              const isPosted = isOrderPosted(item);
              const isFailed = isOrderFailed(item);
              const isPosting = isOrderPosting(item);
              const showAdvancedFields = Boolean(advancedOrderIndexes[index]);

              const actionButtons = (
                <div className="flex flex-col items-center justify-center gap-3 w-24 px-4 border-l border-gray-100">
                  {canPostToAthena && !isPosted && !isFailed && !isPosting && (
                    <button
                      type="button"
                      onClick={() => handleEditOrder(index)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      title="Review or edit before posting"
                    >
                      <Pencil className="w-3 h-3" />
                      Review/Edit
                    </button>
                  )}

                  {canPostToAthena && (
                    <PostIconButton
                      onClick={(onSuccess, onError) => {
                        clearOrderFailure(index);
                        setConfirmModal({
                          open: true,
                          order: item,
                          onSuccess,
                          onError,
                        });
                      }}
                      isPosted={isPosted}
                      isFailed={isFailed}
                      isPosting={isPosting}
                    />
                  )}
                </div>
              );

              if (isEditing && !isPosted && !isFailed && !isPosting) {
                return (
                  <div key={index} className="flex py-6 group bg-red-50/30">
                    <div className="flex-1 space-y-4 pr-6">
                      <div>
                        <span className="block text-sm font-semibold text-gray-700 mb-1">
                          Clinical Content
                        </span>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                          value={item.clinical_intent || item.name || ""}
                          onChange={(e) =>
                            item.clinical_intent !== undefined
                              ? handleEditField(index, "clinical_intent", e.target.value)
                              : handleEditField(index, "name", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm font-semibold text-gray-700 mb-1">
                            Type
                          </span>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                            value={item.order_type || ""}
                            onChange={(e) =>
                              handleEditField(index, "order_type", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <span className="block text-sm font-semibold text-gray-700 mb-1">
                            Name
                          </span>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                            value={item.selected_order_name || ""}
                            onChange={(e) =>
                              handleEditField(
                                index,
                                "selected_order_name",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="w-1/2 pr-2">
                        <span className="block text-sm font-semibold text-gray-700 mb-1">
                          Priority
                        </span>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 bg-white shadow-sm"
                          value={item.priority || "Routine"}
                          onChange={(e) =>
                            handleEditField(index, "priority", e.target.value)
                          }
                        >
                          <option value="Routine">Routine</option>
                          <option value="Stat">Stat</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-sm font-semibold text-gray-700 mb-1">
                          Provider Notes
                        </span>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm resize-y"
                          value={item.additional_instructions || item.notes || ""}
                          onChange={(e) =>
                            handleEditField(
                              index,
                              item.additional_instructions !== undefined
                                ? "additional_instructions"
                                : "notes",
                              e.target.value
                            )
                          }
                          placeholder="Add clinical notes..."
                        />
                      </div>

                      <div className="space-y-3">
                        {!showAdvancedFields ? (
                          <button
                            type="button"
                            onClick={() => handleToggleAdvancedFields(index)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            Add SNOMED / Athena order ID
                          </button>
                        ) : (
                          <div className="rounded-md border border-gray-200 bg-white p-3 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  SNOMED / Athena mapping
                                </p>
                                <p className="text-xs text-gray-500">
                                  Use only if Athena cannot match the order.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleAdvancedFields(index)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700"
                              >
                                Hide
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="block text-sm font-semibold text-gray-700 mb-1">
                                  SNOMED Code
                                </span>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                                  value={item.snomed_code || ""}
                                  onChange={(e) =>
                                    handleEditField(index, "snomed_code", e.target.value)
                                  }
                                  placeholder="Enter SNOMED code"
                                />
                              </div>

                              <div>
                                <span className="block text-sm font-semibold text-gray-700 mb-1">
                                  Athena Order ID
                                </span>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                                  value={item.athena_order_id || item.order_id || ""}
                                  onChange={(e) => {
                                    handleEditField(index, "athena_order_id", e.target.value);
                                    handleEditField(index, "order_id", e.target.value);
                                  }}
                                  placeholder="Enter Athena order ID"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                          These changes are used for the Athena post only and are not
                          saved back to Seismic.
                        </span>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleCancelEdit(index)}
                          className="px-4 py-2 text-sm border rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDoneEdit(index)}
                          className="px-4 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                    {actionButtons}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex py-6 group hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 space-y-3 pr-6">
                    {(item.clinical_intent || item.name) && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">
                          Clinical Content
                        </span>
                        <span className="text-sm text-gray-900">
                          {item.clinical_intent || item.name}
                        </span>
                      </div>
                    )}

                    {item.order_type && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">
                          Type
                        </span>
                        <span className="text-sm text-gray-900">
                          {item.order_type}
                        </span>
                      </div>
                    )}

                    {item.selected_order_name && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">
                          Name
                        </span>
                        <span className="text-sm text-gray-900">
                          {item.selected_order_name}
                        </span>
                      </div>
                    )}

                    {item.priority && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">
                          Priority
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 mt-0.5 rounded text-xs font-medium border
                          ${
                            item.priority?.toLowerCase() === "stat" ||
                            item.priority?.toLowerCase() === "urgent"
                              ? "text-red-700 bg-red-50 border-red-200"
                              : "text-green-700 bg-green-50 border-green-200"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="block text-sm font-semibold text-gray-700">
                        Provider Notes
                      </span>
                      <div className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">
                        {item.additional_instructions || item.notes || "—"}
                      </div>
                    </div>

                  </div>
                  {actionButtons}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canPostToAthena && <ConfirmModal />}
    </div>
  );
};

export default OrdersSection;
