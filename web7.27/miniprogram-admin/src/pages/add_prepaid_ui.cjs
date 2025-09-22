const fs = require('fs');

// 读取文件
let content = fs.readFileSync('ShopOrderPage.jsx', 'utf8');

// 在预存扣减状态显示后添加预存产品创建界面
const oldUIPattern = `                {/* 预存扣减状态显示 */}
                {orderForm.usePrepaid && (
                  <div className="alert alert-info">
                    <WalletIcon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">使用预存扣减</div>
                      <div className="text-sm">
                        {orderForm.prepaidType === 'amount' 
                          ? \`扣减金额: ¥\${orderForm.prepaidAmount.toFixed(2)}\`
                          : \`扣减产品: \${orderForm.prepaidProducts[0]?.productName || '未知产品'}\`
                        }
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={cancelPrepaid}
                    >
                      取消
                    </button>
                  </div>
                )}`;

const newUIPattern = `                {/* 预存扣减状态显示 */}
                {orderForm.usePrepaid && (
                  <div className="alert alert-info">
                    <WalletIcon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">使用预存扣减</div>
                      <div className="text-sm">
                        {orderForm.prepaidType === 'amount' 
                          ? \`扣减金额: ¥\${orderForm.prepaidAmount.toFixed(2)}\`
                          : \`扣减产品: \${orderForm.prepaidProducts[0]?.productName || '未知产品'}\`
                        }
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={cancelPrepaid}
                    >
                      取消
                    </button>
                  </div>
                )}

                {/* 预存产品创建界面 */}
                {createPrepaidMode && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">创建预存产品</span>
                      <span className="label-text-alt text-info">
                        为客户 {orderForm.customerName} 创建预存产品记录
                      </span>
                    </label>
                    
                    <div className="alert alert-warning mb-4">
                      <GiftIcon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">预存产品创建模式</div>
                        <div className="text-sm">
                          选择要为客户预存的商品，这些商品将被记录为预存产品，客户可在后续订单中使用
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                      {prepaidProductData.selectedProducts.map(product => (
                        <div 
                          key={product.productId} 
                          className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary"
                              checked={product.selected}
                              onChange={() => togglePrepaidProductSelection(product.productId)}
                            />
                            <div>
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-sm text-base-content/60">
                                数量: {product.quantity}个 | 单价: ¥{product.price} | 小计: ¥{(product.price * product.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className={product.selected ? 'badge badge-primary' : 'badge badge-ghost'}>
                            {product.selected ? '已选择' : '未选择'}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 p-3 bg-base-300 rounded-lg">
                      <span className="font-medium">预存总价值：</span>
                      <span className="text-lg font-bold text-primary">
                        ¥{prepaidProductData.selectedProducts
                          .filter(p => p.selected)
                          .reduce((sum, p) => sum + (p.price * p.quantity), 0)
                          .toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="btn btn-ghost flex-1"
                        onClick={cancelPrepaidMode}
                      >
                        取消
                      </button>
                      <button
                        className="btn btn-primary flex-1"
                        onClick={createPrepaidProductRecords}
                        disabled={!prepaidProductData.selectedProducts.some(p => p.selected)}
                      >
                        <GiftIcon className="w-4 h-4" />
                        创建预存记录
                      </button>
                    </div>
                  </div>
                )}`;

content = content.replace(oldUIPattern, newUIPattern);

// 修改确认下单按钮，在预存产品创建模式下隐藏
const oldSubmitButtonPattern = `            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowOrderForm(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={submitOrder}
              >
                确认下单
              </button>
            </div>`;

const newSubmitButtonPattern = `            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowOrderForm(false)}
              >
                取消
              </button>
              {!createPrepaidMode && (
                <button
                  className="btn btn-primary"
                  onClick={submitOrder}
                >
                  确认下单
                </button>
              )}
            </div>`;

content = content.replace(oldSubmitButtonPattern, newSubmitButtonPattern);

// 写入文件
fs.writeFileSync('ShopOrderPage.jsx', content);
console.log('UI修改完成');
