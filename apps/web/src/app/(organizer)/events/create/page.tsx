'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEvent, useUniversities, useUploadCoverImage } from '../../../../hooks/useEvents';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { useToast } from '../../../../components/ui/toast';
import { formatNaira } from '../../../../lib/utils';
import { Calendar, ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle, FileText, MapPin, Ticket, GraduationCap, Disc, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Music & Concerts' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'tech', label: 'Tech & Science' },
  { value: 'comedy', label: 'Comedy & Drama' },
  { value: 'church', label: 'Religion & Church' },
  { value: 'campus', label: 'Campus Event' },
  { value: 'food', label: 'Food & Drinks' },
  { value: 'other', label: 'Other / Custom Category' },
];

const CITY_OPTIONS = [
  { value: 'lagos', label: 'Lagos State' },
  { value: 'abuja', label: 'Abuja FCT' },
  { value: 'ibadan', label: 'Ibadan, Oyo' },
  { value: 'port_harcourt', label: 'Port Harcourt, Rivers' },
];

interface TicketTierForm { name: string; type: 'free' | 'paid'; price: string; quantity: string; description: string; }

const STEPS = [
  { num: 1, label: 'Event Info', icon: FileText },
  { num: 2, label: 'Venue & Date', icon: MapPin },
  { num: 3, label: 'Ticket Tiers', icon: Ticket },
  { num: 4, label: 'Review', icon: CheckCircle },
];

export default function CreateEventWizardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateEvent();
  const { data: universities } = useUniversities();
  const uploadMutation = useUploadCoverImage();
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('music');
  const [manualCategory, setManualCategory] = useState('');
  const [manualUniversityName, setManualUniversityName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUniversityOnly, setIsUniversityOnly] = useState(false);
  const [universityId, setUniversityId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('lagos');
  const [tiers, setTiers] = useState<TicketTierForm[]>([
    { name: 'Standard Gate', type: 'paid', price: '5000', quantity: '200', description: 'General access entry' }
  ]);

  const inputCls = "h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all";

  const handleAddTier = () => setTiers([...tiers, { name: '', type: 'paid', price: '', quantity: '', description: '' }]);
  const handleRemoveTier = (i: number) => {
    if (tiers.length === 1) { toast({ title: 'Minimum 1 tier required', variant: 'destructive' }); return; }
    setTiers(tiers.filter((_, idx) => idx !== i));
  };
  const handleTierChange = (i: number, f: keyof TicketTierForm, v: string) => {
    const u = [...tiers]; (u[i] as any)[f] = v; setTiers(u);
  };

  const handleNext = () => {
    if (step === 1 && (!title || !description || !coverImageUrl)) {
      toast({ title: 'Missing info', description: 'Complete title, description and cover image', variant: 'destructive' }); return;
    }
    if (step === 1 && category === 'other' && !manualCategory.trim()) {
      toast({ title: 'Missing category', description: 'Please enter your custom category name', variant: 'destructive' }); return;
    }
    if (step === 1 && isUniversityOnly && !universityId) {
      toast({ title: 'Select campus', description: 'Choose target university network', variant: 'destructive' }); return;
    }
    if (step === 1 && isUniversityOnly && universityId === 'custom' && !manualUniversityName.trim()) {
      toast({ title: 'Missing university', description: 'Please enter your university name manually', variant: 'destructive' }); return;
    }
    if (step === 2 && (!eventDate || !eventTime || !venue)) {
      toast({ title: 'Missing info', description: 'Complete date, time and venue', variant: 'destructive' }); return;
    }
    if (step === 3 && tiers.some(t => !t.name || (t.type === 'paid' && !t.price) || !t.quantity)) {
      toast({ title: 'Incomplete tier', description: 'Complete all tier fields', variant: 'destructive' }); return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      const isoEventDate = new Date(`${eventDate}T${eventTime}`).toISOString();
      const isoEndDate = new Date(new Date(isoEventDate).getTime() + 4 * 60 * 60 * 1000).toISOString();
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      if (category === 'other' && manualCategory.trim()) {
        formData.append('customCategory', manualCategory.trim());
      }
      formData.append('cover_image_url', coverImageUrl);
      formData.append('is_university_only', String(isUniversityOnly));
      if (isUniversityOnly) {
        if (universityId === 'custom' && manualUniversityName.trim()) {
          formData.append('customUniversity', manualUniversityName.trim());
        } else if (universityId) {
          formData.append('university_id', universityId);
        }
      }
      formData.append('event_date', isoEventDate);
      formData.append('end_date', isoEndDate);
      formData.append('venue', venue);
      formData.append('city', city.toLowerCase().replace(' ', '_'));
      formData.append('status', 'published');
      formData.append('ticket_tiers', JSON.stringify(
        tiers.map(t => ({ 
          name: t.name, 
          price: t.type === 'free' ? 0 : Math.round(parseFloat(t.price || '0') * 100), 
          quantity: parseInt(t.quantity), 
          description: t.description || 'Standard access' 
        }))
      ));
      await createMutation.mutateAsync(formData);
      toast({ title: 'Event Published!', description: 'Your event is now live.', variant: 'success' });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Failed to publish', description: err.response?.data?.message || err.message, variant: 'destructive' });
    }
  };

  const universityOptions = [
    { value: '', label: 'Select University Network' },
    ...(universities?.map((u) => ({ value: u.id, label: `${u.name} (${u.short_code})` })) || []),
    { value: 'custom', label: 'Other / Custom University (Enter manually)' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100">

      {/* Header */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-5 sticky top-0 z-30">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />Dashboard
          </button>
          <h1 className="text-sm font-black text-white font-syne uppercase tracking-widest">Create New Event</h1>
          <div className="text-xs font-black text-zinc-600 uppercase tracking-widest">Step {step}/4</div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* Step indicator */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const done = step > s.num;
            const active = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-[#E8441A] border-[#E8441A] text-white' : active ? 'bg-transparent border-[#E8441A] text-[#E8441A]' : 'bg-transparent border-zinc-800 text-zinc-600'}`}>
                    {done ? <CheckCircle className="h-4.5 w-4.5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${active ? 'text-white' : done ? 'text-[#E8441A]' : 'text-zinc-600'}`}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all ${step > s.num ? 'bg-[#E8441A]' : 'bg-zinc-900'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content panel */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#E8441A]" />Event Information
              </h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Event Title</label>
                <input type="text" placeholder="e.g. Lagos Neon Waves Concert" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</label>
                <textarea rows={4} placeholder="Tell attendees what the vibe is all about..." value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Event Cover Image</label>
                  {/* Mode toggle */}
                  <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
                    <button type="button" onClick={() => setImageInputMode('file')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${ imageInputMode === 'file' ? 'bg-[#E8441A] text-white' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300' }`}>
                      <Upload className="h-3.5 w-3.5" /> Upload File
                    </button>
                    <button type="button" onClick={() => setImageInputMode('url')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${ imageInputMode === 'url' ? 'bg-[#E8441A] text-white' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300' }`}>
                      <LinkIcon className="h-3.5 w-3.5" /> Paste URL
                    </button>
                  </div>
                  {/* File mode */}
                  {imageInputMode === 'file' && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadMutation.mutateAsync(file);
                            setCoverImageUrl(url);
                            setImageUrlInput('');
                            toast({ title: 'Image Uploaded', description: 'Cover image uploaded successfully.', variant: 'success' });
                          } catch (err: any) {
                            toast({ title: 'Upload Failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
                          }
                        }}
                        className="hidden"
                        id="cover-upload-create"
                        disabled={uploadMutation.isPending}
                      />
                      <label
                        htmlFor="cover-upload-create"
                        className={`flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 cursor-pointer hover:border-[#E8441A] hover:text-[#E8441A] transition-all ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {uploadMutation.isPending ? (
                          <><Disc className="h-4 w-4 animate-spin" /> Uploading...</>
                        ) : coverImageUrl && imageInputMode === 'file' ? (
                          <><ImageIcon className="h-4 w-4 text-emerald-400" /> <span className="text-emerald-400">Image Uploaded ✓</span></>
                        ) : (
                          <><Upload className="h-4 w-4" /> Choose Image File (max 5MB)</>
                        )}
                      </label>
                    </div>
                  )}
                  {/* URL mode */}
                  {imageInputMode === 'url' && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={imageUrlInput}
                        onChange={e => setImageUrlInput(e.target.value)}
                        className={inputCls + ' flex-1'}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!imageUrlInput.trim()) return;
                          setCoverImageUrl(imageUrlInput.trim());
                          toast({ title: 'URL Set', description: 'Cover image URL applied.', variant: 'success' });
                        }}
                        className="px-4 h-11 rounded-xl border border-[#E8441A] text-[#E8441A] text-xs font-black uppercase tracking-widest hover:bg-[#E8441A] hover:text-white transition-all shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {/* Preview thumbnail */}
                  {coverImageUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImageUrl} alt="preview" className="h-10 w-16 rounded-lg object-cover shrink-0" />
                      <span className="text-xs text-emerald-400 font-bold flex-1 truncate">Cover image ready</span>
                      <button type="button" onClick={() => { setCoverImageUrl(''); setImageUrlInput(''); }} className="text-zinc-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors">Remove</button>
                    </div>
                  )}
                </div>
              </div>
              {category === 'other' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Custom Category Name</label>
                  <input type="text" placeholder="e.g. Web3 Seminar, Art Exhibition" value={manualCategory} onChange={e => setManualCategory(e.target.value)} className={inputCls} />
                </div>
              )}
              <div className="border-t border-zinc-900 pt-5 flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isUniversityOnly} onChange={e => setIsUniversityOnly(e.target.checked)} className="h-4 w-4 rounded border-zinc-700 text-[#E8441A] bg-zinc-950 focus:ring-[#E8441A]" />
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">Restrict to university students (.edu.ng)</span>
                  </div>
                </label>
                {isUniversityOnly && (
                  <div className="flex flex-col gap-1.5 ml-7">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Target Campus</label>
                    <select value={universityId} onChange={e => setUniversityId(e.target.value)} className={inputCls}>
                      {universityOptions.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
                    </select>
                  </div>
                )}
                {isUniversityOnly && universityId === 'custom' && (
                  <div className="flex flex-col gap-1.5 ml-7">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">University Name (Manual Entry)</label>
                    <input type="text" placeholder="e.g. University of Lagos (UNILAG)" value={manualUniversityName} onChange={e => setManualUniversityName(e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#E8441A]" />Venue & Date
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Event Date</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gate Opening Time</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Venue Address</label>
                <input type="text" placeholder="e.g. Landmark Beach Pavilion, Victoria Island" value={venue} onChange={e => setVenue(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">City</label>
                <select value={city} onChange={e => setCity(e.target.value)} className={inputCls}>
                  {CITY_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[#E8441A]" />Ticket Tiers
                </h2>
                <button onClick={handleAddTier} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-[#E8441A] hover:text-[#E8441A] transition-all text-[10px] font-black uppercase tracking-widest">
                  <Plus className="h-3.5 w-3.5" />Add Tier
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {tiers.map((tier, idx) => (
                  <div key={idx} className="p-5 border border-zinc-900 rounded-2xl bg-zinc-950/40 flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#E8441A] uppercase tracking-widest">Tier #{idx + 1}</span>
                      <button onClick={() => handleRemoveTier(idx)} className="p-1.5 rounded-lg border border-zinc-850 hover:bg-red-950/30 text-zinc-500 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex bg-zinc-900 p-1 rounded-xl w-fit">
                        <button 
                          type="button"
                          onClick={() => handleTierChange(idx, 'type', 'free')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tier.type === 'free' ? 'bg-[#E8441A] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Free
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleTierChange(idx, 'type', 'paid')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tier.type === 'paid' ? 'bg-[#E8441A] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Paid
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tier Name</label>
                          <input type="text" placeholder="VIP Pass" value={tier.name} onChange={e => handleTierChange(idx, 'name', e.target.value)} className={inputCls} />
                        </div>
                        {tier.type === 'paid' && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Price (₦)</label>
                            <input type="number" placeholder="15000" value={tier.price} onChange={e => handleTierChange(idx, 'price', e.target.value)} className={inputCls} />
                          </div>
                        )}
                        <div className={`flex flex-col gap-1.5 ${tier.type === 'free' ? 'sm:col-span-2' : ''}`}>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Quantity</label>
                          <input type="number" placeholder="150" value={tier.quantity} onChange={e => handleTierChange(idx, 'quantity', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</label>
                      <input type="text" placeholder="Includes complementary drinks at the lounge" value={tier.description} onChange={e => handleTierChange(idx, 'description', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />Review & Launch
              </h2>
              <div className="flex flex-col gap-3 p-5 rounded-2xl border border-zinc-900 bg-zinc-950/30 text-sm">
                {[
                  ['Event Title', title],
                  ['Venue', `${venue}, ${city}`],
                  ['Date & Time', `${eventDate} at ${eventTime}`],
                  ['Category', category === 'other' ? `Custom: ${manualCategory}` : CATEGORY_OPTIONS.find(o => o.value === category)?.label || category],
                  ['Campus Lock', isUniversityOnly ? (universityId === 'custom' ? `Custom Campus: ${manualUniversityName}` : 'ACTIVE — Student only') : 'Open to everyone'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-zinc-900/60 last:border-0">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
                    <span className="font-bold text-white text-xs text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Ticket Tiers</span>
                  {tiers.map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-zinc-900 bg-zinc-950">
                      <span className="text-xs font-bold text-zinc-200 uppercase">{t.name} × {t.quantity}</span>
                      <span className="text-sm font-black text-[#E8441A]">
                        {t.type === 'free' ? 'FREE' : formatNaira(parseFloat(t.price || '0') * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation row */}
          <div className="flex justify-between mt-8 pt-6 border-t border-zinc-900 gap-3">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                <ArrowLeft className="h-4 w-4" />Back
              </button>
            ) : (
              <button onClick={() => router.push('/dashboard')} className="text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors px-3 py-2">
                Cancel
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E8441A] hover:brightness-110 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-[#E8441A]/20">
                Next<ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 disabled:opacity-60">
                {createMutation.isPending ? <Disc className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Launch Event
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

