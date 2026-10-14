import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, BookOpen, BookOpenCheck, Check,
  CircleHelp, FileText, FlaskConical, GraduationCap, Hash,
  Home, Library, LogOut, Menu, MessageCircle, Plus, Search, Settings2,
  ShieldCheck, Sparkles, Star, Users, X,
} from 'lucide-react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import API from './api/axios';
import { useAuth } from './AuthContext';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C';
const friendlyDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));
const errorText = (error) => error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
const fileUrl = (url) => url?.startsWith('http') ? url : `${API.defaults.baseURL.replace(/\/api\/?$/, '')}${url}`;

function Avatar({ name, size = 'h-10 w-10', className = '' }) {
  return <div className={`avatar ${size} ${className}`} aria-label={name}>{initials(name)}</div>;
}

function Notice({ children, onDismiss }) {
  if (!children) return null;
  return (
    <div role="alert" className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span>{children}</span>
      {onDismiss && <button className="text-rose-500" onClick={onDismiss} aria-label="Dismiss"><X size={16} /></button>}
    </div>
  );
}

function PageHeading({ kicker, title, detail, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow mb-2">{kicker}</p><h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>{detail && <p className="mt-1.5 text-sm text-muted">{detail}</p>}</div>
      {action}
    </div>
  );
}

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Preparing your workspace…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pageTitle = useMemo(() => ({
    '/': 'Home',
    '/research': 'Research library',
    '/groups': 'Communities',
    '/profile': 'Your profile',
    '/admin': 'Review workspace',
  }[location.pathname] || 'Commonroom'), [location.pathname]);
  const isStaff = ['admin', 'moderator'].includes(user.role);

  const navLink = (to, icon, label, end = false) => (
    <NavLink end={end} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
      {icon}<span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {menuOpen && <button aria-label="Close menu" className="mobile-backdrop lg:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`app-sidebar fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-line bg-white px-5 py-6 ${menuOpen ? 'is-open' : ''}`}>
        <Link to="/" className="mb-9 flex items-center gap-3 px-1" onClick={() => setMenuOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-brand text-white"><BookOpenCheck size={21} /></span>
          <span><span className="block text-[17px] font-bold tracking-tight text-ink">commonroom</span><span className="block text-[11px] text-muted">RESEARCH, TOGETHER</span></span>
        </Link>
        <p className="eyebrow mb-2 px-3">Your workspace</p>
        <nav className="space-y-1">
          {navLink('/', <Home size={18} />, 'Home', true)}
          {navLink('/research', <Library size={18} />, 'Research library')}
          {navLink('/groups', <Users size={18} />, 'Communities')}
          {navLink('/profile', <GraduationCap size={18} />, 'My profile')}
          {isStaff && navLink('/admin', <ShieldCheck size={18} />, 'Review workspace')}
        </nav>
        <div className="mt-8 border-t border-line pt-6">
          <p className="eyebrow mb-3 px-3">A little inspiration</p>
          <div className="rounded-2xl bg-[#f4f6f3] p-4">
            <Sparkles size={17} className="mb-2 text-brand" />
            <p className="text-sm font-semibold leading-5 text-ink">Good ideas grow better together.</p>
            <p className="mt-1.5 text-xs leading-5 text-muted">Share a work in progress, ask a question, or find your people.</p>
            <button onClick={() => navigate('/groups')} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">Find a community <ArrowRight size={13} /></button>
          </div>
        </div>
        <div className="mt-auto rounded-2xl border border-line p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} size="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{user.name}</p><p className="truncate text-xs capitalize text-muted">{user.role.replace('_', ' ')}</p></div>
            <button className="btn-quiet !p-2" title="Sign out" onClick={() => { signOut(); navigate('/login'); }}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-line bg-white/90 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="btn-quiet lg:hidden" aria-label="Open menu"><Menu size={19} /></button>
            <div><p className="hidden text-xs text-muted sm:block">Your research community</p><h2 className="text-base font-semibold text-ink">{pageTitle}</h2></div>
          </div>
          <div className="flex items-center gap-2.5">
            <label className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-line bg-[#fafbfa] px-3 sm:flex">
              <Search size={16} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && navigate(`/research?search=${encodeURIComponent(search)}`)} placeholder="Search research…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
            <button className="btn-quiet hidden sm:inline-flex" title="Help"><CircleHelp size={18} /></button>
            <button className="rounded-full" onClick={() => navigate('/profile')} aria-label="Open profile"><Avatar name={user.name} size="h-9 w-9 text-xs" /></button>
          </div>
        </header>
        <main className="mx-auto max-w-[1320px] px-5 py-7 md:px-9 md:py-9"><Outlet /></main>
      </div>
    </div>
  );
}

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [draft, setDraft] = useState({ title: '', content: '', group_id: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [posted, setPosted] = useState(false);

  async function loadFeed(groupId = selectedGroup) {
    setLoading(true);
    try {
      const [postResult, groupResult] = await Promise.all([
        API.get('/posts', { params: groupId ? { groupId } : {} }),
        API.get('/groups'),
      ]);
      setPosts(postResult.data);
      setGroups(groupResult.data.filter((group) => group.joined));
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadFeed(''); }, []);

  async function submitPost(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await API.post('/posts', { ...draft, group_id: draft.group_id || null });
      setDraft({ title: '', content: '', group_id: '' });
      setPosted(true);
      window.setTimeout(() => setPosted(false), 2800);
      await loadFeed(selectedGroup);
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="min-w-0">
        <div className="mb-7 overflow-hidden rounded-[22px] bg-[#eaf0e9] px-6 py-7 md:px-8 md:py-8">
          <p className="eyebrow text-brand">A space to think out loud</p>
          <h1 className="mt-2 max-w-xl text-[27px] font-semibold leading-tight tracking-tight text-ink">Good morning, {user.name.split(' ')[0]}.</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">What are you curious about today? Share a thought with your academic community.</p>
          <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-500"><span className="h-2 w-2 rounded-full bg-brand" />A kind, curious community — always.</div>
        </div>

        <div className="surface mb-6 p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3"><Avatar name={user.name} size="h-10 w-10 text-xs" /><div><p className="text-sm font-semibold text-ink">Start a conversation</p><p className="text-xs text-muted">Share a finding, an idea, or a question</p></div></div>
          <Notice onDismiss={() => setError('')}>{error}</Notice>
          <form onSubmit={submitPost} className="space-y-3">
            <input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Give your post a title…" required maxLength={200} />
            <textarea className="field min-h-[94px] resize-y" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="What would you like to share with the community?" required />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted"><MessageCircle size={15} /><span>Thoughtful conversations start here</span></div>
              <div className="flex items-center gap-2">
                <select className="max-w-[190px] rounded-xl border border-line bg-white px-3 py-2.5 text-xs text-slate-600 outline-none" value={draft.group_id} onChange={(event) => setDraft({ ...draft, group_id: event.target.value })}>
                  <option value="">Everyone</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
                <button className="btn-primary" disabled={busy}>{posted ? <><Check size={16} /> Shared</> : <><Plus size={16} /> Share</>}</button>
              </div>
            </div>
          </form>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-semibold text-ink">Community feed</h2><p className="mt-1 text-xs text-muted">Fresh perspectives from your corner of academia.</p></div>
          <select className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-600 outline-none" value={selectedGroup} onChange={(event) => { setSelectedGroup(event.target.value); loadFeed(event.target.value); }}>
            <option value="">All conversations</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        </div>
        {loading ? <div className="surface p-8 text-center text-sm text-muted">Loading conversations…</div> : posts.length === 0 ? (
          <div className="surface px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eff4f0] text-brand"><MessageCircle size={21} /></div><h3 className="mt-4 font-semibold text-ink">A quiet moment in the community</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">Start the first conversation. Your next question might be exactly what someone else needs.</p></div>
        ) : <div className="space-y-4">{posts.map((post) => <article key={post.id} className="surface p-5 md:p-6">
          <div className="flex items-start gap-3"><Avatar name={post.author_name} size="h-10 w-10 text-xs" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2"><span className="text-sm font-semibold text-ink">{post.author_name}</span><span className="rounded-md bg-[#f2f4f5] px-1.5 py-0.5 text-[10px] capitalize text-muted">{post.author_role?.replace('_', ' ')}</span><span className="text-xs text-muted">· {friendlyDate(post.created_at)}</span></div><p className="mt-0.5 text-xs text-muted">{post.group_name ? `in ${post.group_name}` : 'Community conversation'}</p></div><button className="btn-quiet !p-2" aria-label="Post options"><Settings2 size={16} /></button></div>
          <h3 className="mt-4 text-base font-semibold text-ink">{post.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{post.content}</p>
          <div className="mt-5 flex items-center gap-5 border-t border-line pt-4 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><MessageCircle size={15} /> Join the conversation</span>{post.group_name && <span className="inline-flex items-center gap-1"><Hash size={13} />{post.group_name}</span>}</div>
        </article>)}</div>}
      </section>

      <aside className="space-y-5">
        <div className="surface p-5"><div className="flex items-center justify-between"><h3 className="font-semibold text-ink">Your communities</h3><Link className="text-xs font-semibold text-brand" to="/groups">Explore</Link></div><p className="mt-1 text-xs text-muted">Ideas are better when they're shared.</p>
          {groups.length ? <div className="mt-4 space-y-3">{groups.slice(0, 4).map((group, index) => <Link key={group.id} to="/groups" className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-slate-50"><span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold ${['bg-[#f5eee8] text-[#9b714c]', 'bg-[#edf0f8] text-[#596a9d]', 'bg-[#f4edf5] text-[#8c638f]', 'bg-[#eaf2ed] text-[#4f775f]'][index % 4]}`}><Hash size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink">{group.name}</span><span className="text-xs text-muted">{group.member_count} members</span></span><ArrowUpRight size={15} className="text-slate-400" /></Link>)}</div> : <p className="mt-4 rounded-xl bg-[#fafbfa] p-3 text-xs leading-5 text-muted">Find a community to connect with people who share your interests.</p>}
        </div>
        <div className="rounded-2xl bg-[#f0f2ed] p-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand"><FlaskConical size={18} /></div><h3 className="mt-3 font-semibold text-ink">Make your work discoverable</h3><p className="mt-1 text-xs leading-5 text-slate-600">Your research deserves an audience that gets it.</p><Link to="/research" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">Visit the library <ArrowRight size={13} /></Link></div>
        <p className="px-1 text-[11px] leading-5 text-slate-400">A space for sharing knowledge with care. Be generous, cite your sources, and leave room for different perspectives.</p>
      </aside>
    </div>
  );
}

function ResearchPage() {
  const [papers, setPapers] = useState([]);
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [myPapers, setMyPapers] = useState([]);

  async function loadPapers(search = query) {
    setLoading(true);
    try {
      const [publicPapers, authoredPapers] = await Promise.all([API.get('/papers', { params: search ? { search } : {} }), API.get('/papers/mine').catch(() => ({ data: [] }))]);
      setPapers(publicPapers.data);
      setMyPapers(authoredPapers.data);
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadPapers(''); }, []);

  return (
    <div>
      <PageHeading kicker="Curiosity, in print" title="Research library" detail="Peer-reviewed work, open questions, and the people behind them." action={<button className="btn-primary" onClick={() => setShowUpload(!showUpload)}><Plus size={16} /> Share a paper</button>} />
      {showUpload && <PaperUpload onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); loadPapers(); }} />}
      <Notice onDismiss={() => setError('')}>{error}</Notice>
      <form className="surface mb-5 flex gap-2 p-3" onSubmit={(event) => { event.preventDefault(); loadPapers(query); }}>
        <Search size={17} className="ml-2 mt-3 text-slate-400" /><input className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search papers, authors, abstracts, or DOI…" /><button className="btn-soft !px-3.5 !py-2">Search</button>
      </form>
      {myPapers.some((paper) => paper.status !== 'approved') && <div className="surface mb-6 p-5"><h3 className="text-sm font-semibold text-ink">Your submissions</h3><div className="mt-3 space-y-2">{myPapers.filter((paper) => paper.status !== 'approved').map((paper) => <div key={paper.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#fafbfa] px-3 py-2.5"><span className="truncate text-sm text-slate-700">{paper.title}</span><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${paper.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{paper.status.replace('_', ' ')}</span></div>)}</div></div>}
      <div className="mb-4 flex items-end justify-between"><div><h2 className="text-base font-semibold text-ink">Published research</h2><p className="mt-1 text-xs text-muted">{papers.length} open-access {papers.length === 1 ? 'paper' : 'papers'}</p></div><span className="eyebrow">Latest first</span></div>
      {loading ? <div className="surface p-8 text-center text-sm text-muted">Finding the latest research…</div> : papers.length === 0 ? <div className="surface px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eff4f0] text-brand"><BookOpen size={22} /></div><h3 className="mt-4 font-semibold text-ink">Nothing published just yet</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">Be the first to share a paper. Submissions are reviewed by our research community before they appear here.</p><button className="btn-soft mt-4" onClick={() => setShowUpload(true)}><Plus size={15} /> Submit research</button></div> :
        <div className="grid gap-4 lg:grid-cols-2">{papers.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div>}
    </div>
  );
}

function PaperCard({ paper }) {
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expanded && reviews.length === 0) API.get(`/papers/${paper.id}/reviews`).then(({ data }) => setReviews(data)).catch((requestError) => setError(errorText(requestError)));
  }, [expanded, paper.id, reviews.length]);

  async function submitReview(event) {
    event.preventDefault();
    try {
      const { data } = await API.post(`/papers/${paper.id}/reviews`, { comment, rating });
      setReviews((current) => [data, ...current.filter((review) => review.reviewer_id !== data.reviewer_id)]);
      setComment('');
    } catch (requestError) { setError(errorText(requestError)); }
  }

  return (
    <article className="surface flex min-h-[260px] flex-col p-5">
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f3ed] text-brand"><FileText size={18} /></span><div className="min-w-0 flex-1"><p className="eyebrow">{paper.doi ? `DOI · ${paper.doi}` : 'RESEARCH ARTICLE'}</p><h3 className="mt-1 text-[15px] font-semibold leading-5 text-ink">{paper.title}</h3></div><span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"><Star size={12} fill="currentColor" /> {paper.average_rating || '—'}</span></div>
      <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{paper.abstract}</p>
      <div className="mt-auto pt-5"><div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><div className="flex items-center gap-2.5"><Avatar name={paper.author_name} size="h-8 w-8 text-[10px]" /><span><span className="block text-xs font-semibold text-ink">{paper.author_name}</span><span className="text-[11px] text-muted">{friendlyDate(paper.created_at)} · {paper.review_count || 0} reviews</span></span></div><div className="flex items-center gap-1">{paper.pdf_url && <a href={fileUrl(paper.pdf_url)} target="_blank" rel="noreferrer" className="btn-quiet !px-2.5 !py-2"><BookOpen size={15} /> Read PDF</a>}<button onClick={() => setExpanded(!expanded)} className="btn-quiet !px-2.5 !py-2">{expanded ? 'Close' : 'Review'} <ArrowRight size={14} /></button></div></div></div>
      {expanded && <div className="mt-4 border-t border-line pt-4"><Notice>{error}</Notice><div className="space-y-3">{reviews.map((review) => <div key={review.id} className="rounded-xl bg-[#fafbfa] p-3"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-ink">{review.reviewer_name || 'Your review'}</span><span className="inline-flex items-center gap-1 text-amber-700"><Star size={12} fill="currentColor" /> {review.rating}/5</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{review.comment}</p></div>)}</div><form className="mt-3 space-y-2" onSubmit={submitReview}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Your review</span><select className="rounded-lg border border-line bg-white px-2 py-1 text-xs" value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((score) => <option key={score} value={score}>{score} stars</option>)}</select></div><textarea className="field min-h-[74px] resize-y !text-xs" required value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What did you think of this work?" /><button className="btn-soft !py-2">Submit review</button></form></div>}
    </article>
  );
}

function PaperUpload({ onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', abstract: '', doi: '' });
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (pdf) body.append('pdf', pdf);
    try {
      await API.post('/papers', body);
      onUploaded();
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setBusy(false); }
  }

  return <div className="surface mb-6 p-5 md:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="eyebrow">Add to the library</p><h2 className="mt-1 text-lg font-semibold text-ink">Submit your research</h2><p className="mt-1 text-xs text-muted">A reviewer will take a look before it's published.</p></div><button className="btn-quiet !p-2" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <Notice onDismiss={() => setError('')}>{error}</Notice><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
      <label className="md:col-span-2"><span className="form-label">Paper title</span><input required maxLength={250} className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="A clear, descriptive title" /></label>
      <label className="md:col-span-2"><span className="form-label">Abstract</span><textarea required className="field min-h-[120px] resize-y" value={form.abstract} onChange={(event) => setForm({ ...form, abstract: event.target.value })} placeholder="A brief summary of the work, its methods, and what you found…" /></label>
      <label><span className="form-label">DOI <span className="font-normal text-muted">(optional)</span></span><input className="field" value={form.doi} onChange={(event) => setForm({ ...form, doi: event.target.value })} placeholder="10.1234/example" /></label>
      <label><span className="form-label">Paper PDF <span className="font-normal text-muted">(20 MB max)</span></span><input required className="field !py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eff4f0] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand" type="file" accept="application/pdf,.pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} /></label>
      <div className="flex items-center justify-end gap-2 md:col-span-2"><button type="button" className="btn-quiet" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'} <ArrowRight size={15} /></button></div>
    </form></div>;
}

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadGroups() {
    setLoading(true);
    try { const { data } = await API.get('/groups'); setGroups(data); }
    catch (requestError) { setError(errorText(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadGroups(); }, []);

  async function createGroup(event) {
    event.preventDefault();
    try { await API.post('/groups', form); setForm({ name: '', description: '' }); setShowCreate(false); loadGroups(); }
    catch (requestError) { setError(errorText(requestError)); }
  }
  async function joinGroup(id) {
    try { await API.post(`/groups/${id}/join`); loadGroups(); }
    catch (requestError) { setError(errorText(requestError)); }
  }

  return <div>
    <PageHeading kicker="Find your people" title="Communities" detail="Small corners of the internet for big academic questions." action={<button className="btn-primary" onClick={() => setShowCreate(!showCreate)}><Plus size={16} /> Start a community</button>} />
    <Notice onDismiss={() => setError('')}>{error}</Notice>
    {showCreate && <form onSubmit={createGroup} className="surface mb-6 grid gap-3 p-5 md:grid-cols-[1fr_1.5fr_auto] md:items-end"><label><span className="form-label">Community name</span><input required className="field" maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Urban ecology" /></label><label><span className="form-label">What is it about?</span><input className="field" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A few words about the group" /></label><button className="btn-primary">Create community</button></form>}
    {loading ? <div className="surface p-8 text-center text-sm text-muted">Finding your communities…</div> : groups.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{groups.map((group, index) => <article key={group.id} className="surface p-5"><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-[14px] ${['bg-[#f3eee8] text-[#97724f]', 'bg-[#edf0f8] text-[#5d6e9f]', 'bg-[#f2edf5] text-[#8c6a91]', 'bg-[#e9f0ea] text-[#4f775f]'][index % 4]}`}><Hash size={19} /></span>{group.joined && <span className="rounded-full bg-[#eff4f0] px-2.5 py-1 text-[10px] font-semibold text-brand">MEMBER</span>}</div><h3 className="mt-4 text-base font-semibold text-ink">{group.name}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-muted">{group.description || 'A community for shared questions, thoughtful discussion, and research.'}</p><div className="mt-4 flex items-center justify-between border-t border-line pt-4"><span className="inline-flex items-center gap-1.5 text-xs text-muted"><Users size={14} /> {group.member_count} members</span>{group.joined ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand"><Check size={14} /> Joined</span> : <button className="btn-soft !py-2" onClick={() => joinGroup(group.id)}>Join group</button>}</div></article>)}</div> : <div className="surface p-10 text-center"><Users className="mx-auto text-brand" size={25} /><h3 className="mt-3 font-semibold text-ink">Your community starts here</h3><p className="mt-1 text-sm text-muted">Start a group and invite others into the conversation.</p></div>}
  </div>;
}

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', institution: user.institution || '' });
  const [papers, setPapers] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { API.get('/papers/mine').then(({ data }) => setPapers(data)).catch((requestError) => setError(errorText(requestError))); }, []);
  async function save(event) {
    event.preventDefault();
    try { const { data } = await API.patch('/users/me', form); updateUser(data); setSaved(true); window.setTimeout(() => setSaved(false), 2500); }
    catch (requestError) { setError(errorText(requestError)); }
  }

  return <div className="mx-auto max-w-3xl">
    <PageHeading kicker="A little about you" title="Your profile" detail="Help your community know who's behind the ideas." />
    <Notice onDismiss={() => setError('')}>{error}</Notice>
    <div className="surface mb-5 overflow-hidden"><div className="h-24 bg-[#eaf0e9]" /><div className="px-6 pb-6"><div className="-mt-9 flex items-end gap-4"><Avatar name={user.name} size="h-[72px] w-[72px] text-xl ring-4 ring-white" /><div className="pb-1"><h2 className="text-lg font-semibold text-ink">{user.name}</h2><p className="text-xs capitalize text-muted">{user.role.replace('_', ' ')}</p></div></div>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={save}><label><span className="form-label">Name</span><input required className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span className="form-label">Institution</span><input className="field" value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="University or organization" /></label><label className="md:col-span-2"><span className="form-label">About you</span><textarea className="field min-h-[100px] resize-y" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Your research interests, current questions, or what you're working on…" /></label><div className="flex items-center justify-between md:col-span-2"><span className="text-xs text-muted">{user.email}</span><button className="btn-primary">{saved ? <><Check size={15} /> Saved</> : 'Save profile'}</button></div></form>
    </div></div>
    <div className="surface p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-ink">Your research</h2><p className="mt-1 text-xs text-muted">Papers you've shared with the community.</p></div><Link to="/research" className="text-xs font-semibold text-brand">Research library <ArrowRight size={13} className="inline" /></Link></div>
      {papers.length === 0 ? <p className="mt-5 rounded-xl bg-[#fafbfa] p-4 text-sm text-muted">Nothing shared yet. Your research will show up here.</p> : <div className="mt-4 divide-y divide-line">{papers.map((paper) => <div key={paper.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{paper.title}</p><p className="mt-1 text-xs text-muted">{friendlyDate(paper.created_at)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${paper.status === 'approved' ? 'bg-[#eff4f0] text-brand' : paper.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{paper.status.replace('_', ' ')}</span></div>)}</div>}
    </div>
  </div>;
}

function AdminPage() {
  const [papers, setPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('papers');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function load() {
    setLoading(true);
    try {
      const requests = [API.get('/admin/papers')];
      if (user.role === 'admin') requests.push(API.get('/admin/users'));
      const [paperResult, userResult] = await Promise.all(requests);
      setPapers(paperResult.data);
      setUsers(userResult?.data || []);
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try { await API.patch(`/admin/papers/${id}/status`, { status }); load(); }
    catch (requestError) { setError(errorText(requestError)); }
  }
  async function updateRole(id, role) {
    try { await API.patch(`/admin/users/${id}/role`, { role }); setUsers((current) => current.map((person) => person.id === id ? { ...person, role } : person)); }
    catch (requestError) { setError(errorText(requestError)); }
  }

  const paperQueue = papers.length ? (
    <div className="space-y-4">
      {papers.map((paper) => (
        <article key={paper.id} className="surface p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-amber-700">{paper.status.replace('_', ' ')}</span>
              <h3 className="mt-3 text-base font-semibold text-ink">{paper.title}</h3>
              <p className="mt-1 text-xs text-muted">Submitted by {paper.author_name} · {friendlyDate(paper.created_at)}{paper.doi && ` · DOI ${paper.doi}`}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{paper.abstract}</p>
              {paper.pdf_url && <a className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand" href={fileUrl(paper.pdf_url)} target="_blank" rel="noreferrer"><BookOpen size={14} /> Read submitted PDF</a>}
            </div>
            <div className="flex gap-2">
              <button className="btn-soft !py-2" onClick={() => updateStatus(paper.id, 'under_review')}>Reviewing</button>
              <button className="btn-primary !bg-rose-600 !py-2 hover:!bg-rose-700" onClick={() => updateStatus(paper.id, 'rejected')}>Decline</button>
              <button className="btn-primary !py-2" onClick={() => updateStatus(paper.id, 'approved')}><Check size={15} /> Approve</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <div className="surface p-10 text-center"><ShieldCheck className="mx-auto text-brand" size={25} /><h3 className="mt-3 font-semibold text-ink">All caught up</h3><p className="mt-1 text-sm text-muted">No papers are waiting for review. Nice work.</p></div>
  );
  const userDirectory = users.length ? (
    <div className="surface overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_170px] gap-4 border-b border-line bg-[#fafbfa] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted"><span>Member</span><span>Email</span><span>Account role</span></div>
      {users.map((person) => (
        <div key={person.id} className="grid grid-cols-[1fr_1fr_170px] items-center gap-4 border-b border-line px-5 py-3.5 last:border-0">
          <div className="flex items-center gap-2.5"><Avatar name={person.name} size="h-8 w-8 text-[10px]" /><span className="truncate text-sm font-medium text-ink">{person.name}</span></div>
          <span className="truncate text-xs text-muted">{person.email}</span>
          <select className="rounded-lg border border-line bg-white px-2 py-2 text-xs capitalize outline-none" value={person.role} onChange={(event) => updateRole(person.id, event.target.value)}>{['user', 'researcher', 'moderator', 'group_admin', 'admin'].map((role) => <option className="capitalize" key={role} value={role}>{role.replace('_', ' ')}</option>)}</select>
        </div>
      ))}
    </div>
  ) : <div className="surface p-8 text-center text-sm text-muted">No members found.</div>;

  return <div>
    <PageHeading kicker="Careful review, better work" title="Review workspace" detail="Support the quality of research shared in this community." />
    <Notice onDismiss={() => setError('')}>{error}</Notice>
    {user.role === 'admin' && <div className="mb-5 flex gap-2 border-b border-line">{[['papers', 'Paper submissions'], ['users', 'People & roles']].map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`border-b-2 px-3 py-2.5 text-sm font-medium ${tab === value ? 'border-brand text-brand' : 'border-transparent text-muted'}`}>{label}</button>)}</div>}
    {loading ? <div className="surface p-8 text-center text-sm text-muted">Loading the review queue…</div> : tab === 'papers' ? paperQueue : userDirectory}
  </div>;
}

function AuthPage({ mode }) {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(form);
      else await signIn({ email: form.email, password: form.password });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setBusy(false); }
  }

  return <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
    <div className="relative hidden overflow-hidden bg-[#eaf0e9] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
      <Link to="/login" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-brand text-white"><BookOpenCheck size={21} /></span><span className="text-[17px] font-bold tracking-tight text-ink">commonroom</span></Link>
      <div className="relative z-10 max-w-xl"><p className="eyebrow text-brand">A home for curious minds</p><h1 className="mt-4 text-5xl font-semibold leading-[1.12] tracking-[-.04em] text-ink xl:text-[58px]">Research is better when it's <span className="text-brand">shared.</span></h1><p className="mt-5 max-w-md text-base leading-7 text-slate-600">Meet kindred minds, exchange ideas, and make your work find the people it deserves.</p><div className="mt-8 flex items-center gap-3"><div className="flex -space-x-2">{['AJ', 'MK', 'TR', 'SL'].map((name, index) => <span key={name} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-[#eaf0e9] text-[10px] font-semibold ${['bg-[#d8e4dc] text-[#456655]', 'bg-[#eee2d3] text-[#946f4c]', 'bg-[#e2e1ee] text-[#666187]', 'bg-[#efe0e5] text-[#97636e]'][index]}`}>{name}</span>)}</div><span className="text-xs text-slate-600">A thoughtful community, from day one</span></div></div>
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full border border-[#dce5dc]" /><div className="absolute -bottom-12 -right-4 h-56 w-56 rounded-full border border-[#dce5dc]" />
      <p className="relative z-10 text-xs text-slate-500">For the questions that bring us together.</p>
    </div>
    <div className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-9 flex items-center gap-3 lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-brand text-white"><BookOpenCheck size={21} /></span><span className="text-[17px] font-bold text-ink">commonroom</span></div>
        <p className="eyebrow text-brand">{mode === 'signup' ? 'A community for your curiosity' : 'Welcome back'}</p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-ink">{mode === 'signup' ? 'Find your people.' : 'Good to see you.'}</h2>
        <p className="mt-2 text-sm text-muted">{mode === 'signup' ? 'Create an account and join the conversation.' : 'Sign in to pick up where you left off.'}</p>
        <Notice>{error}</Notice>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'signup' && <label className="block"><span className="form-label">Your name</span><input className="field" required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ada Lovelace" autoComplete="name" /></label>}
          <label className="block"><span className="form-label">Email address</span><input className="field" type="email" required maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@university.edu" autoComplete="email" /></label>
          {mode === 'signup' && <label className="block"><span className="form-label">Institution <span className="font-normal text-muted">(optional)</span></span><input className="field" value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="University or organization" autoComplete="organization" /></label>}
          <label className="block"><span className="form-label">Password</span><input className="field" type="password" required minLength={mode === 'signup' ? 8 : 1} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>
          <button className="btn-primary mt-2 w-full !py-3" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create your account' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">{mode === 'signup' ? 'Already part of the community?' : 'New around here?'} <Link className="font-semibold text-brand" to={mode === 'signup' ? '/login' : '/signup'}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</Link></p>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} /> Your research and details stay yours.</div>
      </div>
    </div>
  </div>;
}

function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/signup" element={<AuthPage mode="signup" />} />
    <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
      <Route index element={<FeedPage />} />
      <Route path="research" element={<ResearchPage />} />
      <Route path="groups" element={<GroupsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="admin" element={<RequireAuth roles={['admin', 'moderator']}><AdminPage /></RequireAuth>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default App;
