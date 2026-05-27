'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calendar, Plus, X, Paperclip } from 'lucide-react';
import { addExpense } from '@/app/actions';

const formatAmount = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toFixed(2);
};

interface Member {
  id: string;
  name: string;
}

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: Member[];
  currentUser: {
    id: string;
    fullName: string | null;
    firstName: string | null;
  } | null;
  onSuccess: () => void;
}

export default function AddExpenseDialog({
  isOpen,
  onClose,
  groupId,
  members,
  currentUser,
  onSuccess,
}: AddExpenseDialogProps) {
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [payerId, setPayerId] = useState<string>('');
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>('equal');
  const [splitMode, setSplitMode] = useState<'split' | 'you-owe-all' | 'they-owe-all'>('split');
  const [customPercentages, setCustomPercentages] = useState<{ [id: string]: string }>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptData, setReceiptData] = useState<string | null>(null);
  const [receiptType, setReceiptType] = useState<string | null>(null);
  
  const [showPayerDropdown, setShowPayerDropdown] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setReceiptData(reader.result as string);
      setReceiptType(file.type);
    };
  };

  // Initialize selected members to all group members by default
  useEffect(() => {
    if (isOpen) {
      setSelectedMembers(members);
      if (currentUser) {
        setPayerId(currentUser.id);
      } else if (members.length > 0) {
        setPayerId(members[0].id);
      }
      // Reset form fields
      setDescription('');
      setAmount('');
      setSplitType('equal');
      setSplitMode('split');
      setCustomPercentages({});
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptData(null);
      setReceiptType(null);
    }
  }, [isOpen, members, currentUser]);

  const numAmount = parseFloat(amount) || 0;
  const isMe = (id: string) => currentUser && id === currentUser.id;

  const getMemberName = (id: string) => {
    if (isMe(id)) return 'você';
    const m = members.find((member) => member.id === id);
    if (!m) return 'Desconhecido';
    const parts = m.name.split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : m.name;
  };

  const getPayerName = () => {
    return payerId === currentUser?.id ? 'você' : getMemberName(payerId);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast({ title: 'Aviso', description: 'Por favor, insira uma descrição.', variant: 'destructive' });
      return;
    }
    if (numAmount <= 0) {
      toast({ title: 'Aviso', description: 'Por favor, insira um valor válido maior que zero.', variant: 'destructive' });
      return;
    }

    let finalSplitWith = selectedMembers;

    if (splitMode === 'you-owe-all') {
      const meMember = members.find((m) => isMe(m.id));
      if (!meMember) return;
      finalSplitWith = [meMember];
    } else if (splitMode === 'they-owe-all') {
      finalSplitWith = selectedMembers.filter((m) => !isMe(m.id));
    }

    if (finalSplitWith.length === 0) {
      toast({ title: 'Aviso', description: 'Selecione pelo menos uma pessoa para dividir.', variant: 'destructive' });
      return;
    }

    if (splitType === 'percentage' && splitMode === 'split') {
      const sum = Object.values(customPercentages).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        toast({ title: 'Aviso', description: 'A soma das porcentagens deve ser exatamente 100%.', variant: 'destructive' });
        return;
      }
    }

    const result = await addExpense({
      amount: numAmount,
      description,
      groupId,
      splitPercentage: 100, // 100% of expense total is split
      splitWith: finalSplitWith,
      createdBy: payerId,
      createdAt: new Date(date + 'T12:00:00').toISOString(),
      receiptData: receiptData || undefined,
      receiptType: receiptType || undefined,
    });

    if (result.success) {
      toast({ title: 'Sucesso! 🎉', description: 'Despesa adicionada com sucesso.' });
      onSuccess();
      onClose();
    } else {
      toast({ title: 'Erro', description: 'Falha ao adicionar despesa.', variant: 'destructive' });
    }
  };

  const toggleMember = (member: Member) => {
    if (selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const activeMembersCount = selectedMembers.length;
  const amountPerPerson = activeMembersCount > 0 ? numAmount / activeMembersCount : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 rounded-xl shadow-2xl">
        {/* Header matching Splitwise's teal style */}
        <DialogHeader className="bg-teal-500 text-white p-4 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-bold text-white">Adicionar despesa</DialogTitle>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-5 bg-white max-h-[85vh] overflow-y-auto">
          {/* Top Options matching Splitwise split modes */}
          <div className="flex flex-col gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <button
              type="button"
              className={`w-full py-1.5 px-4 rounded-lg text-xs font-bold transition-all text-center ${
                splitMode === 'split'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => {
                setSplitMode('split');
                setSelectedMembers(members);
              }}
            >
              Dividir despesa
            </button>
            <button
              type="button"
              className={`w-full py-1.5 px-4 rounded-lg text-xs font-bold transition-all text-center ${
                splitMode === 'you-owe-all'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => {
                setSplitMode('you-owe-all');
                if (currentUser) {
                  setPayerId(currentUser.id);
                  setSelectedMembers(members.filter((m) => isMe(m.id)));
                }
              }}
            >
              Você deve o valor total
            </button>
            <button
              type="button"
              className={`w-full py-1.5 px-4 rounded-lg text-xs font-bold transition-all text-center ${
                splitMode === 'they-owe-all'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => {
                setSplitMode('they-owe-all');
                if (currentUser) {
                  setPayerId(currentUser.id);
                  setSelectedMembers(members.filter((m) => !isMe(m.id)));
                }
              }}
            >
              Eles devem o valor total
            </button>
          </div>

          {/* Chips Section */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold text-xs">Com você e:</span>
              {selectedMembers.filter(m => m.id !== currentUser?.id).map((member) => (
                <span
                  key={member.id}
                  className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors border text-gray-800 text-[11px] px-2.5 py-1 rounded-full cursor-pointer font-medium"
                  onClick={() => toggleMember(member)}
                >
                  {getMemberName(member.id)}
                  <X size={11} className="text-gray-500" />
                </span>
              ))}

              {/* Add Member Quick Selector */}
              {members.filter(m => !selectedMembers.some(sm => sm.id === m.id)).length > 0 && (
                <div className="relative inline-block group">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors"
                  >
                    <Plus size={11} /> Adicionar
                  </button>
                  <div className="absolute hidden group-hover:block z-20 mt-1 left-0 bg-white border shadow-xl rounded-md py-1 max-h-32 overflow-y-auto w-40">
                    {members
                      .filter(m => !selectedMembers.some(sm => sm.id === m.id))
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 text-gray-700 font-medium"
                          onClick={() => toggleMember(m)}
                        >
                          {m.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description & Amount Input */}
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
              <FileText size={28} className="text-gray-500" />
            </div>
            <div className="flex-grow space-y-1">
              <input
                type="text"
                placeholder="Insira a descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-b border-dashed border-gray-300 py-1 text-base font-semibold text-gray-900 focus:outline-none focus:border-teal-500 bg-transparent placeholder-gray-300"
              />
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-gray-700">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-3xl font-semibold text-gray-900 focus:outline-none bg-transparent placeholder-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Summary and Payer Line */}
          <div className="text-center text-xs text-gray-700 bg-gray-50 rounded-xl p-2.5 border border-gray-100 relative">
            <span>Pago por </span>
            <span
              className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 font-bold cursor-pointer inline-block"
              onClick={() => setShowPayerDropdown(!showPayerDropdown)}
            >
              {getPayerName()}
            </span>
            <span> e dividido </span>
            <span className="font-bold text-gray-900">
              {splitMode === 'split' ? (splitType === 'equal' ? 'igualmente' : 'personalizado') : 'integralmente'}
            </span>

            {/* Payer Dropdown */}
            {showPayerDropdown && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white border shadow-2xl rounded-lg py-1 z-20 w-44">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold py-1 px-3">Quem pagou?</p>
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-teal-50 text-gray-700 ${payerId === member.id ? 'bg-teal-50/50 text-teal-600 font-bold' : ''}`}
                    onClick={() => {
                      setPayerId(member.id);
                      setShowPayerDropdown(false);
                    }}
                  >
                    {isMe(member.id) ? 'Você' : member.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Split checklist matching Splitwise design */}
          {splitMode === 'split' && (
            <div className="border border-gray-200 rounded-xl p-3.5 bg-white space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Dividir {splitType === 'equal' ? 'igualmente' : 'por porcentagem'}
                </h4>
                
                {/* Horizontal toggle button group for Equal/Percentage */}
                <div className="flex border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-bold transition-all ${
                      splitType === 'equal' ? 'bg-white text-teal-600 shadow-sm border-r border-l' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSplitType('equal')}
                  >
                    =
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-bold transition-all ${
                      splitType === 'percentage' ? 'bg-white text-teal-600 shadow-sm border-r border-l' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSplitType('percentage')}
                  >
                    %
                  </button>
                </div>
              </div>

              {/* Members Checklist */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {members.map((member) => {
                  const isSelected = selectedMembers.some((sm) => sm.id === member.id);
                  let displayShare = 0;
                  if (isSelected) {
                    if (splitType === 'equal') {
                      displayShare = amountPerPerson;
                    } else {
                      const pct = parseFloat(customPercentages[member.id]) || 0;
                      displayShare = (numAmount * pct) / 100;
                    }
                  }

                  return (
                    <div key={member.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`split-check-${member.id}`}
                          checked={isSelected}
                          onChange={() => toggleMember(member)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`split-check-${member.id}`}
                          className="text-xs font-bold text-gray-700 cursor-pointer"
                        >
                          {getMemberName(member.id)}
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        {splitType === 'percentage' && isSelected && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="0"
                              value={customPercentages[member.id] || ''}
                              onChange={(e) => {
                                setCustomPercentages({
                                  ...customPercentages,
                                  [member.id]: e.target.value,
                                });
                              }}
                              className="w-12 border rounded bg-white py-0.5 px-1.5 text-right text-[11px] font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <span className="text-[11px] font-bold text-gray-400">%</span>
                          </div>
                        )}
                        <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-300'}`}>
                          R${formatAmount(displayShare)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Picker Pill & Receipt Upload */}
          <div className="flex justify-center gap-2 flex-wrap">
            <div className="relative inline-flex border bg-white shadow-sm hover:bg-gray-50 transition-colors py-1.5 px-4 rounded-full text-xs font-bold text-gray-600 cursor-pointer flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-0 outline-none cursor-pointer focus:ring-0 p-0 text-xs font-semibold text-gray-700"
              />
            </div>
            
            <label className="relative inline-block border bg-white shadow-sm hover:bg-gray-50 transition-colors py-1.5 px-4 rounded-full text-xs font-bold text-gray-600 cursor-pointer flex items-center gap-1.5">
              <Paperclip size={14} className={receiptData ? "text-teal-500" : "text-gray-400"} />
              <span className={receiptData ? "text-teal-600" : "text-gray-700"}>
                {receiptData ? 'Recibo anexado' : 'Anexar Recibo'}
              </span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Action buttons Cancel / Save */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              className="bg-white px-6 rounded-lg text-gray-600 border border-gray-200 text-xs font-bold"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 rounded-lg text-xs font-bold"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
