import { useMemo } from "react";
import PaymentPage from "../admin-akuntan/PaymentPage";

export default function SupplierPayments({ purchaseOrderId, purchaseOrder }) {
  const order = useMemo(() => purchaseOrder || { purchase_order_id: purchaseOrderId }, [purchaseOrder, purchaseOrderId]);
  return <PaymentPage purchaseOrder={order} readOnly />;
}