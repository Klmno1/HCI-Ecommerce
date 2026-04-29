"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { IconButton } from "@mui/material";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/utils";

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, increaseItem, decreaseItem, removeItem, totalAmount, totalQuantity } = useCart();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[420px] flex-col bg-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900">購物車</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                已加入 {totalQuantity} 件商品
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton aria-label="關閉購物車">
                <CloseRoundedIcon />
              </IconButton>
            </Dialog.Close>
          </div>

          <ScrollArea.Root className="min-h-0 flex-1">
            <ScrollArea.Viewport className="h-full">
              <div className="space-y-3 p-5">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    購物車目前是空的，先去挑幾件喜歡的商品吧。
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${encodeURIComponent(item.id)}`}
                          prefetch
                          onClick={() => onOpenChange(false)}
                          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 px-2 text-center text-xs text-slate-500 transition hover:bg-slate-200"
                          aria-label={`View ${item.name}`}
                        >
                          {item.imageText}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/products/${encodeURIComponent(item.id)}`}
                              prefetch
                              onClick={() => onOpenChange(false)}
                              className="min-w-0 rounded-md transition hover:text-[#2147d1] focus:outline-none focus:ring-2 focus:ring-[#3965ff]/30"
                            >
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.subcategory}</p>
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-slate-200">
                              <button type="button" className="px-2 py-1" onClick={() => decreaseItem(item.id)}>
                                <RemoveRoundedIcon fontSize="small" />
                              </button>
                              <span className="min-w-10 text-center text-sm font-semibold">{item.quantity}</span>
                              <button type="button" className="px-2 py-1" onClick={() => increaseItem(item.id)}>
                                <AddRoundedIcon fontSize="small" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#ff5a36]">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              <p className="text-xs text-slate-400 line-through">
                                {formatPrice(item.originalPrice * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" className="flex w-2 touch-none bg-slate-100 p-[1px]">
              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-slate-300" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <div className="border-t border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>商品總計</span>
              <span>{totalQuantity} 件</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">結帳金額</span>
              <span className="text-2xl font-bold text-[#2147d1]">{formatPrice(totalAmount)}</span>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#3965ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2147d1]"
            >
              前往結帳
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
