import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, MessageCircle } from "lucide-react";
import type { ReceiptData } from "./types";

interface Props {
  data: ReceiptData | null;
  open: boolean;
  onClose: () => void;
}

export default function POSReceipt({ data, open, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  if (!data) return null;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '', 'width=320,height=600');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt</title><style>
      body { font-family: monospace; font-size: 12px; padding: 10px; max-width: 300px; margin: 0 auto; }
      .center { text-align: center; } .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; }
      table { width: 100%; } td { padding: 2px 0; }
      .right { text-align: right; }
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;
    const blob = new Blob([`<html><head><style>
      body { font-family: monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
      .center { text-align: center; } .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; }
      table { width: 100%; } td { padding: 2px 0; }
      .right { text-align: right; }
    </style></head><body>${content.innerHTML}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${data.receiptNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = () => {
    let text = `*${data.businessName}*\nReceipt: ${data.receiptNumber}\nDate: ${data.date}\n\n`;
    data.items.forEach(i => {
      text += `${i.name} x${i.quantity} = TZS ${i.subtotal.toLocaleString()}\n`;
    });
    text += `\nSubtotal: TZS ${data.subtotal.toLocaleString()}`;
    if (data.totalItemDiscount > 0) text += `\nDiscounts: -TZS ${data.totalItemDiscount.toLocaleString()}`;
    if (data.saleDiscount > 0) text += `\nSale Discount: -TZS ${data.saleDiscount.toLocaleString()}`;
    text += `\n*Total: TZS ${data.finalTotal.toLocaleString()}*`;
    text += `\nPayment: ${data.paymentMethod}`;
    if (data.paymentMethod === 'cash') {
      text += `\nReceived: TZS ${data.amountReceived.toLocaleString()}`;
      text += `\nBalance: TZS ${data.balanceReturned.toLocaleString()}`;
    }
    text += `\n\nThank you for your purchase!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>

        <div ref={receiptRef} className="font-mono text-xs space-y-1 p-3 bg-card rounded border border-border">
          <div className="center bold" style={{ fontSize: '14px' }}>{data.businessName}</div>
          <div className="line" />
          <div className="row"><span>Receipt:</span><span className="bold">{data.receiptNumber}</span></div>
          <div className="row"><span>Date:</span><span>{data.date}</span></div>
          <div className="line" />
          <table>
            <thead>
              <tr><td className="bold">Item</td><td className="bold right">Qty</td><td className="bold right">Amount</td></tr>
            </thead>
            <tbody>
              {data.items.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.name}</td>
                  <td className="right">{i.quantity}</td>
                  <td className="right">TZS {i.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="line" />
          <div className="row"><span>Subtotal:</span><span>TZS {data.subtotal.toLocaleString()}</span></div>
          {data.totalItemDiscount > 0 && (
            <div className="row"><span>Discounts:</span><span>-TZS {data.totalItemDiscount.toLocaleString()}</span></div>
          )}
          {data.saleDiscount > 0 && (
            <div className="row"><span>Sale Discount:</span><span>-TZS {data.saleDiscount.toLocaleString()}</span></div>
          )}
          <div className="line" />
          <div className="row bold" style={{ fontSize: '14px' }}><span>TOTAL:</span><span>TZS {data.finalTotal.toLocaleString()}</span></div>
          <div className="line" />
          <div className="row"><span>Payment:</span><span>{data.paymentMethod.replace('_', ' ')}</span></div>
          {data.paymentMethod === 'cash' && (
            <>
              <div className="row"><span>Received:</span><span>TZS {data.amountReceived.toLocaleString()}</span></div>
              <div className="row"><span>Balance:</span><span>TZS {data.balanceReturned.toLocaleString()}</span></div>
            </>
          )}
          <div className="line" />
          <div className="center">Thank you for your purchase!</div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" /> Print</Button>
          <Button variant="outline" className="flex-1" onClick={handleDownload}><Download className="mr-1 h-4 w-4" /> Save</Button>
          <Button variant="outline" className="flex-1" onClick={handleWhatsApp}><MessageCircle className="mr-1 h-4 w-4" /> WhatsApp</Button>
        </div>
        <Button className="w-full" onClick={onClose}>New Sale</Button>
      </DialogContent>
    </Dialog>
  );
}
