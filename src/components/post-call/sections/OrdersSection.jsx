import { useState, useEffect } from "react";

/**
 * Helpers
 */
const splitLabNames = (name = "") =>
  name
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const OrdersSection = ({ ordersData }) => {
  const confirmed = ordersData?.confirmed;

  /**
   * SOURCE OF TRUTH
   */
  const [editableOrders, setEditableOrders] = useState([]);
  const [removedKeys, setRemovedKeys] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPosted, setIsPosted] = useState(false);

  useEffect(() => {
    setEditableOrders(ordersData?.orders || []);
    setIsPosted(Boolean(ordersData?.confirmed));
  }, [ordersData]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Normalize for rendering
   */
  const normalizedOrders = editableOrders.flatMap((order, orderIdx) => {
    if (order.order_type === "Lab") {
      return splitLabNames(order.name).map((labName, idx) => ({
        ...order,
        name: toTitleCase(labName),
        __key: `lab-${orderIdx}-${idx}`,
        __index: orderIdx,
      }));
    }

    return {
      ...order,
      name: toTitleCase(order.name),
      __key: `${order.order_type}-${orderIdx}`,
      __index: orderIdx,
    };
  });

  /**
   * Group for UI
   */
  const grouped = normalizedOrders.reduce((acc, order) => {
    const type = order.order_type || "Other";
    acc[type] = acc[type] || {
      items: [],
      reason: order.reason || "",
      instructions: order.additional_instructions || "",
    };
    acc[type].items.push(order);
    return acc;
  }, {});

  const visibleOrderCount = normalizedOrders.filter(
    (o) => !removedKeys[o.__key]
  ).length;

  const handleRemove = (key) => {
    if (isPosted) return;
    setRemovedKeys((prev) => ({ ...prev, [key]: true }));
  };

  const handleSaveOrders = () => {
    ordersData.orders = editableOrders;
    setIsEditing(false);
    showToast("success", "Orders updated");
  };

  return (
  <div className="border rounded-lg bg-white p-6 space-y-10 relative">
  {toast && (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-md text-sm bg-white border ${
        toast.type === "error"
          ? "border-red-300 text-red-700"
          : "border-gray-300 text-gray-800"
      }`}
    >
      {toast.message}
    </div>
  )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-blue-600">Orders</h2>

            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                isPosted
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-100 text-gray700"
              }`}
            >
              {isPosted ? "Placed" : "Pending"}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {visibleOrderCount}{" "}
            {isPosted ? "orders placed" : "orders to be placed"}
          </p>

          {typeof confirmed === "boolean" && (
            <p className="text-sm mt-1">
              <span className="font-medium">Orders Confirmed:</span>{" "}
              {confirmed ? "Yes" : "No"}
            </p>
          )}
        </div>

        <button
          disabled={isPosted}
          onClick={() =>
            isEditing ? handleSaveOrders() : setIsEditing(true)
          }
          className={`px-4 py-1 text-sm rounded border ${
            isPosted
              ? "border-gray-300 text-gray-400 cursor-not-allowed"
              : "border-blue-600 text-blue-600 hover:bg-blue-50"
          }`}
        >
          {isEditing ? "Save Orders" : "Edit Orders"}
        </button>
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([type, group]) => {
        const visibleItems = group.items.filter(
          (item) => !removedKeys[item.__key]
        );

        if (!visibleItems.length) return null;

        return (
          <div key={type} className="space-y-4">
            <button
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [type]: !prev[type],
                }))
              }
              className="w-full flex justify-between items-center text-left text-lg font-semibold border-b pb-2"
            >
              <span>
                {type} ({visibleItems.length})
              </span>
              <span className="text-sm text-gray-500">
                {collapsed[type] ? "Show" : "Hide"}
              </span>
            </button>

            {!collapsed[type] && (
              <>
                {/* Reason */}
                <div>
                  <p className="text-sm font-medium mb-1">Reason</p>
                  {isEditing ? (
                    <textarea
                      value={group.reason}
                      onChange={(e) =>
                        setEditableOrders((prev) =>
                          prev.map((o) =>
                            o.order_type === type
                              ? { ...o, reason: e.target.value }
                              : o
                          )
                        )
                      }
                      className="w-full border rounded p-2 text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm">{group.reason || "—"}</p>
                  )}
                </div>

                {/* Orders */}
                <ul className="space-y-2">
                  {visibleItems.map((item) => (
                    <li
                      key={item.__key}
                      className="flex justify-between items-center border rounded px-3 py-2 bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span>{item.name}</span>

                        {isEditing ? (
                          <select
                            value={item.priority || "Routine"}
                            onChange={(e) =>
                              setEditableOrders((prev) =>
                                prev.map((o, i) =>
                                  i === item.__index
                                    ? {
                                        ...o,
                                        priority: e.target.value,
                                      }
                                    : o
                                )
                              )
                            }
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="Routine">Routine</option>
                            <option value="STAT">STAT</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-500">
                            ({item.priority || "Routine"})
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isPosted}
                        onClick={() => handleRemove(item.__key)}
                        className={`text-sm ${
                          isPosted
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-400 hover:text-red-600"
                        }`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Instructions */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="text-sm font-semibold text-blue-700">
                    Patient Instructions
                  </p>

                  {isEditing ? (
                    <textarea
                      value={group.instructions}
                      onChange={(e) =>
                        setEditableOrders((prev) =>
                          prev.map((o) =>
                            o.order_type === type
                              ? {
                                  ...o,
                                  additional_instructions: e.target.value,
                                }
                              : o
                          )
                        )
                      }
                      className="w-full mt-1 border rounded p-2 text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-blue-900">
                      {group.instructions || "—"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

    </div>
  );
};

export default OrdersSection