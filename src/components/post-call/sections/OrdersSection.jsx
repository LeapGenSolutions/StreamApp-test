import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  postAllOrders,
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

const getOrderKey = (order = {}) => {
  const title =
    order.selected_order_name || order.clinical_intent || order.name || "";
  const notes = order.additional_instructions || order.notes || "";

  return [
    normalizeOrderValue(title),
    normalizeOrderValue(order.order_type),
    normalizeOrderValue(order.priority),
    normalizeOrderValue(notes),
  ].join("|");
};

const getOrderLabel = (order = {}) =>
  order.selected_order_name ||
  order.clinical_intent ||
  order.name ||
  order.order_type ||
  "Order";

const POSTED_BADGE_DURATION_MS = 3000;

const PostIconButton = ({ onClick, disabled, isPosted = false }) => {
  const [status, setStatus] = useState("idle");

  const handleClick = () => {
    if (status !== "idle" || disabled || isPosted) return;

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

  if (isPosted) {
    bgClass = "bg-green-50 text-green-700 border-green-200 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Posted</span>;
  } else if (disabled) {
    bgClass =
      "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed";
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
      disabled={disabled || status !== "idle" || isPosted}
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all ${bgClass} ${
        status === "idle" ? "w-7" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const OrdersSection = ({
  ordersData,
  onOrdersUpdate,
  doctorEmail,
  encounterId,
  practiceId,
  canPostToAthena = true,
}) => {
  const { toast } = useToast();
  const emptyConfirmModal = {
    open: false,
    type: null,
    order: null,
    onSuccess: null,
    onError: null,
  };

  const emptyBatchModal = {
    open: false,
    statusMap: {},
    posting: false,
    resultMap: {},
  };

  const [editableOrders, setEditableOrders] = useState([]);
  const [removedKeys, setRemovedKeys] = useState({});
  const [postedOrderKeys, setPostedOrderKeys] = useState({});
  const [recentlyPostedOrderKeys, setRecentlyPostedOrderKeys] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const postedBadgeTimeoutsRef = useRef({});

  const [confirmModal, setConfirmModal] = useState(emptyConfirmModal);

  const [batchModal, setBatchModal] = useState(emptyBatchModal);

  const renderModal = (node) => {
    if (typeof document === "undefined") return null;
    return createPortal(node, document.body);
  };

  const clearPostedBadgeTimeout = (orderKey) => {
    const timeoutId = postedBadgeTimeoutsRef.current[orderKey];
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    delete postedBadgeTimeoutsRef.current[orderKey];
  };

  const markOrderPosted = (order) => {
    const orderKey = getOrderKey(order);

    setPostedOrderKeys((prev) => ({ ...prev, [orderKey]: true }));
    setRecentlyPostedOrderKeys((prev) => ({ ...prev, [orderKey]: true }));

    clearPostedBadgeTimeout(orderKey);
    postedBadgeTimeoutsRef.current[orderKey] = setTimeout(() => {
      setRecentlyPostedOrderKeys((prev) => {
        if (!prev[orderKey]) return prev;
        const next = { ...prev };
        delete next[orderKey];
        return next;
      });
      delete postedBadgeTimeoutsRef.current[orderKey];
    }, POSTED_BADGE_DURATION_MS);
  };

  useEffect(() => {
    const timeoutStore = postedBadgeTimeoutsRef.current;
    return () => {
      Object.values(timeoutStore).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    const uniqueOrders = [];
    const seen = new Set();
    const incoming = ordersData?.orders || [];

    for (const order of incoming) {
      const orderName =
        order.selected_order_name || order.clinical_intent || order.name || "";
      const type = order.order_type || "";
      const key = `${orderName}-${type}`.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueOrders.push(order);
      }
    }

    setEditableOrders(uniqueOrders);
    setRemovedKeys({});
    setPostedOrderKeys((prev) => {
      const next = {};
      uniqueOrders.forEach((order) => {
        const key = getOrderKey(order);
        if (prev[key]) next[key] = true;
      });
      return next;
    });
    setRecentlyPostedOrderKeys((prev) => {
      const next = {};
      uniqueOrders.forEach((order) => {
        const key = getOrderKey(order);
        if (prev[key]) next[key] = true;
      });
      return next;
    });
  }, [ordersData]);

  const handleRemove = (key) => {
    if (!isEditing) return;
    setRemovedKeys((prev) => ({ ...prev, [key]: true }));
  };

  const handleEditField = (index, field, value) => {
    if (!isEditing) return;
    const previous = editableOrders[index];
    if (previous) {
      const previousKey = getOrderKey(previous);
      setPostedOrderKeys((prev) => {
        if (!prev[previousKey]) return prev;
        const next = { ...prev };
        delete next[previousKey];
        return next;
      });
      setRecentlyPostedOrderKeys((prev) => {
        if (!prev[previousKey]) return prev;
        const next = { ...prev };
        delete next[previousKey];
        return next;
      });
      clearPostedBadgeTimeout(previousKey);
    }

    setEditableOrders((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const postOrder = async (order, doctorEmail, encounterId, practiceId) => {
    let res;

    if (order.order_type === "Imaging") {
      res = await postImaging(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "Lab") {
      res = await postLab(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "Procedure") {
      res = await postProcedure(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "Other") {
      res = await postOther(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "Referral") {
      res = await postReferral(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "Vaccine") {
      res = await postVaccine(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "PatientInfo") {
      res = await postPatientInfo(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "Prescription") {
      res = await postPrescription(doctorEmail, encounterId, order, practiceId);
    } else if (order.order_type === "DME") {
      res = await postDME(doctorEmail, encounterId, order, practiceId);
    } else {
      throw new Error(`Unsupported order type: ${order.order_type}`);
    }

    if (!res || res.error || res.message || res.detailedmessage) {
      throw new Error(
        res?.error || res?.message || res?.detailedmessage || "Order post failed"
      );
    }

    return res;
  };

  const getOrderResultFromBatchResponse = (result, order, batchIndex) => {
    if (Array.isArray(result?.results)) {
      return result.results[batchIndex];
    }

    const key1 = order?.clinical_intent;
    const key2 = order?.order_type;
    const key3 = order?.selected_order_name;
    const key4 = order?.name;

    if (key1 && result?.[key1]) return result[key1];
    if (key2 && result?.[key2]) return result[key2];
    if (key3 && result?.[key3]) return result[key3];
    if (key4 && result?.[key4]) return result[key4];

    return null;
  };

  const isBatchItemSuccess = (orderResult) => {
    if (!orderResult) return false;
    if (orderResult.success === true) return true;
    if (orderResult.ok === true) return true;
    if (orderResult.error) return false;
    return false;
  };

  const getBatchItemError = (orderResult) => {
    if (!orderResult) return "No response for this order";
    return (
      orderResult.error ||
      orderResult.message ||
      orderResult.detailedmessage ||
      "Order post failed"
    );
  };

  const showOrderFailureToast = (order, message) => {
    toast({
      title: `Failed to post ${getOrderLabel(order)}`,
      description: message || "Order post failed",
    });
  };

  const getActiveIndexes = () => {
    if (!canPostToAthena) return [];
    return editableOrders
      .map((_, index) => index)
      .filter((index) => !removedKeys[index])
      .filter((index) => !postedOrderKeys[getOrderKey(editableOrders[index])]);
  };

  const openBatchModal = () => {
    const initialStatus = {};
    getActiveIndexes().forEach((index) => {
      initialStatus[index] = "idle";
    });

    setBatchModal({
      open: true,
      statusMap: initialStatus,
      posting: false,
      resultMap: {},
    });
  };

  const updateBatchStatus = (index, status) => {
    setBatchModal((prev) => ({
      ...prev,
      statusMap: {
        ...prev.statusMap,
        [index]: status,
      },
    }));
  };

  const handleBatchPost = async () => {
    if (batchModal.posting) return;

    const indexes = getActiveIndexes();
    const ordersToPost = indexes.map((index) => editableOrders[index]);

    setBatchModal((prev) => ({
      ...prev,
      posting: true,
      statusMap: indexes.reduce((acc, index) => {
        acc[index] = "loading";
        return acc;
      }, {}),
      resultMap: {},
    }));

    try {
      const result = await postAllOrders(
        doctorEmail,
        encounterId,
        ordersToPost,
        practiceId
      );

      if (result?.error || result?.message || result?.detailedmessage) {
        throw new Error(
          result?.error ||
            result?.message ||
            result?.detailedmessage ||
            "Failed to post all orders"
        );
      }

      const newStatusMap = {};
      const newResultMap = {};
      indexes.forEach((index, batchIndex) => {
        const order = editableOrders[index];
        const orderResult = getOrderResultFromBatchResponse(
          result,
          order,
          batchIndex
        );

        if (isBatchItemSuccess(orderResult)) {
          newStatusMap[index] = "success";
          markOrderPosted(order);
        } else {
          newStatusMap[index] = "failed";
        }

        newResultMap[index] = orderResult || {
          success: false,
          error: "No response for this order",
        };
      });

      const failedIndexes = indexes.filter(
        (index) => newStatusMap[index] === "failed"
      );

      setBatchModal((prev) => ({
        ...prev,
        posting: false,
        statusMap: newStatusMap,
        resultMap: newResultMap,
      }));

      if (failedIndexes.length) {
        const firstFailedIndex = failedIndexes[0];
        const firstFailedOrder = editableOrders[firstFailedIndex];
        const firstFailedMessage = getBatchItemError(
          newResultMap[firstFailedIndex]
        );

        toast({
          title:
            failedIndexes.length === indexes.length
              ? "Failed to post orders"
              : "Some orders failed to post",
          description:
            failedIndexes.length === 1
              ? `${getOrderLabel(firstFailedOrder)}: ${firstFailedMessage}`
              : `${failedIndexes.length} orders failed. First error: ${firstFailedMessage}`,
        });
      }
    } catch (error) {
      const failedMap = {};
      const failedResultMap = {};

      indexes.forEach((index) => {
        failedMap[index] = "failed";
        failedResultMap[index] = {
          success: false,
          error: error?.message || "Failed to post all orders",
        };
      });

      setBatchModal((prev) => ({
        ...prev,
        posting: false,
        statusMap: failedMap,
        resultMap: failedResultMap,
      }));

      toast({
        title: "Failed to post orders",
        description: error?.message || "Failed to post all orders",
      });
    }
  };

  const retrySingle = async (index) => {
    try {
      updateBatchStatus(index, "loading");
      await postOrder(editableOrders[index], doctorEmail, encounterId, practiceId);
      updateBatchStatus(index, "success");
      markOrderPosted(editableOrders[index]);
      setBatchModal((prev) => ({
        ...prev,
        resultMap: {
          ...prev.resultMap,
          [index]: { success: true },
        },
      }));
    } catch (error) {
      updateBatchStatus(index, "failed");
      setBatchModal((prev) => ({
        ...prev,
        resultMap: {
          ...prev.resultMap,
          [index]: {
            success: false,
            error: error?.message || "Order post failed",
          },
        },
      }));
      showOrderFailureToast(
        editableOrders[index],
        error?.message || "Order post failed"
      );
    }
  };

  const ConfirmModal = () => {
    if (!confirmModal.open) return null;

    const isPost = confirmModal.type === "post";

    return renderModal(
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 relative">
          <button
            onClick={() => setConfirmModal(emptyConfirmModal)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold mb-4">
            {isPost ? "Confirm Post" : "Confirm Removal"}
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to {isPost ? "post" : "remove"}{" "}
            <span className="font-semibold">
              {confirmModal.order?.selected_order_name ||
                confirmModal.order?.clinical_intent ||
                confirmModal.order?.name}
            </span>
            ?
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmModal(emptyConfirmModal)}
              className="px-4 py-1 text-sm border rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                if (isPost) {
                  try {
                    await postOrder(
                      confirmModal.order,
                      doctorEmail,
                      encounterId,
                      practiceId
                    );
                    markOrderPosted(confirmModal.order);
                    confirmModal.onSuccess?.();
                  } catch (error) {
                    confirmModal.onError?.(error);
                    showOrderFailureToast(
                      confirmModal.order,
                      error?.message || "Order post failed"
                    );
                  }
                } else {
                  handleRemove(confirmModal.order.__key);
                }

                setConfirmModal(emptyConfirmModal);
              }}
              className={`px-4 py-1 text-sm rounded-md text-white ${
                isPost
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPost ? "Post" : "Remove"}
            </button>
          </div>
        </div>
      </div>,
    );
  };

  const BatchModal = () => {
    if (!batchModal.open) return null;

    const indexes = Object.keys(batchModal.statusMap);
    const total = indexes.length;
    const successCount = indexes.filter(
      (i) => batchModal.statusMap[Number(i)] === "success"
    ).length;
    const failedCount = indexes.filter(
      (i) => batchModal.statusMap[Number(i)] === "failed"
    ).length;
    const loadingCount = indexes.filter(
      (i) => batchModal.statusMap[Number(i)] === "loading"
    ).length;

    return renderModal(
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-[520px] p-6 relative">
          <button
            onClick={() => setBatchModal(emptyBatchModal)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold">Post All Orders</h3>
          <p className="text-sm text-gray-500 mb-3">Total Orders: {total}</p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs rounded-full bg-green-50 text-green-700 px-2 py-1 border border-green-200 font-medium">
              Success: {successCount}
            </span>
            <span className="text-xs rounded-full bg-red-50 text-red-700 px-2 py-1 border border-red-200 font-medium">
              Failed: {failedCount}
            </span>
            <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-1 border border-blue-200 font-medium">
              In Progress: {loadingCount}
            </span>
          </div>

          {batchModal.posting ? (
            <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-md text-blue-700 text-sm font-medium">
              <Loader2 size={16} className="animate-spin" />
              Posting selected orders to Athena...
            </div>
          ) : total > 0 && successCount === total ? (
            <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-md text-green-700 text-sm font-medium">
              <CheckCircle2 size={16} />
              All orders posted successfully.
            </div>
          ) : failedCount > 0 && successCount > 0 ? (
            <div className="mb-4 flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded-md text-orange-700 text-sm font-medium">
              <AlertCircle size={16} />
              Partial success: {successCount} posted, {failedCount} failed.
            </div>
          ) : failedCount === total && total > 0 ? (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-md text-red-700 text-sm font-medium">
              <AlertCircle size={16} />
              Failed to post all selected orders.
            </div>
          ) : null}

          <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
            {indexes.map((i) => {
              const index = Number(i);
              const status = batchModal.statusMap[index];
              const order = editableOrders[index];
              const result = batchModal.resultMap[index];

              return (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between mb-2 border-b border-gray-200 pb-2">
                      <h4 className="font-semibold text-gray-900">
                        {order.clinical_intent || order.name || "Unknown Intent"}
                      </h4>
                      {order.priority && (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                          ${
                            order.priority?.toLowerCase() === "stat" ||
                            order.priority?.toLowerCase() === "urgent"
                              ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                              : "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                          }`}
                        >
                          {order.priority}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                      {order.selected_order_name && (
                        <div className="text-xs text-gray-600 truncate">
                          <span className="font-semibold text-gray-500">Name:</span>{" "}
                          {order.selected_order_name}
                        </div>
                      )}
                      {order.order_type && (
                        <div className="text-xs text-gray-600 truncate">
                          <span className="font-semibold text-gray-500">Type:</span>{" "}
                          {order.order_type}
                        </div>
                      )}
                    </div>

                    {(order.additional_instructions || order.notes) && (
                      <div className="text-xs text-gray-500 mt-2 italic truncate">
                        <span className="font-semibold text-gray-400 not-italic mr-1">
                          Notes:
                        </span>
                        {order.additional_instructions || order.notes}
                      </div>
                    )}

                    {status === "failed" && (
                      <div className="text-xs text-red-600 mt-2">
                        {getBatchItemError(result)}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-1 min-w-[60px]">
                    {status === "idle" && (
                      <span className="text-gray-400 text-sm">Ready</span>
                    )}
                    {status === "loading" && (
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    )}
                    {status === "success" && (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-xs font-medium">Posted</span>
                      </div>
                    )}
                    {status === "failed" && (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <button
                          onClick={() => retrySingle(index)}
                          className="text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setBatchModal(emptyBatchModal)}
              className="px-4 py-1 text-sm border rounded-md"
            >
              Close
            </button>

            <button
              onClick={handleBatchPost}
              disabled={batchModal.posting || !total}
              className="px-4 py-1 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {batchModal.posting ? "Posting..." : "Confirm Post"}
            </button>
          </div>
        </div>
      </div>,
    );
  };

  const visibleOrders = editableOrders.filter((_, index) => !removedKeys[index]);

  return (
    <div className="space-y-6 text-gray-900 leading-snug">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-black text-lg">Clinical Orders</h3>
        <span className="text-sm rounded-full bg-blue-50 text-blue-700 px-3 py-0.5 border border-blue-100 font-medium">
          {visibleOrders.length} Orders
        </span>
      </div>

      <div className="space-y-4">
        {visibleOrders.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">
            No orders associated with this encounter.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {editableOrders.map((item, index) => {
              if (removedKeys[index]) return null;

              const actionButtons = (
                <div className="flex flex-col items-center justify-center gap-3 w-16 px-4 border-l border-gray-100">
                  {canPostToAthena && (
                    <PostIconButton
                      onClick={(onSuccess, onError) =>
                        setConfirmModal({
                          open: true,
                          type: "post",
                          order: item,
                          onSuccess,
                          onError,
                        })
                      }
                      isPosted={Boolean(
                        recentlyPostedOrderKeys[getOrderKey(item)]
                      )}
                    />
                  )}

                  {isEditing && (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          open: true,
                          type: "remove",
                          order: { ...item, __key: index },
                        })
                      }
                      className="text-gray-400 hover:text-red-600 transition-colors bg-white w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:border-red-200"
                      title="Remove Order"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );

              if (isEditing) {
                return (
                  <div key={index} className="flex py-6 group">
                    <div className="flex-1 space-y-4 pr-6">
                      <div>
                        <span className="block text-sm font-semibold text-gray-700 mb-1">
                          Clinical Content <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                          value={item.clinical_intent || item.name || ""}
                          onChange={(e) => {
                            if (item.clinical_intent !== undefined) {
                              handleEditField(index, "clinical_intent", e.target.value);
                            } else {
                              handleEditField(index, "name", e.target.value);
                            }
                          }}
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
                              "additional_instructions",
                              e.target.value
                            )
                          }
                          placeholder="Add clinical notes..."
                        />
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

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
        {canPostToAthena && (
          <button
            onClick={openBatchModal}
            disabled={!visibleOrders.length}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4 py-2 rounded-md disabled:opacity-50 transition-colors shadow-sm"
          >
            Post All Orders
          </button>
        )}

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium h-10 px-4 py-2 rounded-md transition-colors shadow-sm"
          >
            Edit Orders
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                const updated = editableOrders.filter((_, index) => !removedKeys[index]);
                onOrdersUpdate?.(updated);
                setIsEditing(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              Save Orders
            </button>

            <button
              onClick={() => {
                const incoming = ordersData?.orders || [];
                setEditableOrders(incoming);
                setRemovedKeys({});
                setIsEditing(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium h-10 px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {canPostToAthena && <ConfirmModal />}
      {canPostToAthena && <BatchModal />}
    </div>
  );
};

export default OrdersSection
