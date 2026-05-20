import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Folder, FileText, ChevronRight,
  ExternalLink, Code2, PlayCircle, Hash
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const MOCK_KNOWLEDGE = [
  {
    category: 'Graph Theory',
    topics: [
      { id: 1, title: 'Dijkstra Algorithm', type: 'article', tags: ['Shortest Path', 'Greedy'] },
      { id: 2, title: 'Disjoint Set Union (DSU)', type: 'video', tags: ['Data Structure', 'Trees'] },
      { id: 3, title: 'Lowest Common Ancestor', type: 'code', tags: ['Trees', 'Binary Lifting'] },
    ]
  },
  {
    category: 'Dynamic Programming',
    topics: [
      { id: 4, title: 'Knapsack Problem Variations', type: 'article', tags: ['DP', 'Optimization'] },
      { id: 5, title: 'Digit DP Guide', type: 'article', tags: ['DP', 'Math'] },
      { id: 6, title: 'DP on Trees', type: 'code', tags: ['DP', 'Trees'] },
    ]
  },
  {
    category: 'Advanced Data Structures',
    topics: [
      { id: 7, title: 'Segment Tree Implementation', type: 'code', tags: ['Queries', 'Updates'] },
      { id: 8, title: 'Fenwick Tree (BIT)', type: 'article', tags: ['Queries', 'Prefix Sums'] },
      { id: 9, title: 'Trie / Prefix Tree', type: 'video', tags: ['Strings'] },
    ]
  }
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(MOCK_KNOWLEDGE[0].category);

  return (
    <motion.div
      className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1400px] mx-auto box-border"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          <BookOpen size={28} className="text-[var(--color-primary)]" />
          Knowledge Base
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
          Curated CP algorithms, tutorials, and standard implementations
        </p>
      </motion.div>

      {/* Search */}
      <motion.div className="mb-8 relative" variants={itemVariants}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
        <input 
          type="text" 
          placeholder="Search algorithms, data structures..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 glass-panel rounded-xl text-[var(--text-primary)] text-sm shadow-[var(--shadow-sm)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)] transition-all"
        />
      </motion.div>

      <div className="flex max-md:flex-col gap-8">
        {/* Categories Sidebar */}
        <motion.div className="w-[280px] max-md:w-full shrink-0 flex flex-col gap-2" variants={itemVariants}>
          <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 pl-2">Categories</div>
          {MOCK_KNOWLEDGE.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              className={`flex items-center justify-between w-full p-3 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === cat.category 
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md' 
                : 'bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder size={16} className={activeCategory === cat.category ? 'text-white' : 'text-[var(--color-primary)]'} />
                {cat.category}
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeCategory === cat.category ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'}`}>
                {cat.topics.length}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Content List */}
        <motion.div className="flex-1 flex flex-col gap-4" variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">{activeCategory}</h2>
          </div>
          
          <AnimatePresence mode="popLayout">
            {MOCK_KNOWLEDGE.find(c => c.category === activeCategory)?.topics.map((topic) => (
              <motion.div
                key={topic.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="group flex flex-col p-5 glass-panel rounded-xl shadow-[var(--shadow-sm)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-colors">
                      {topic.type === 'article' && <FileText size={18} />}
                      {topic.type === 'video' && <PlayCircle size={18} />}
                      {topic.type === 'code' && <Code2 size={18} />}
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] m-0 group-hover:text-[var(--color-primary)] transition-colors">
                      {topic.title}
                    </h3>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex gap-2 pl-12">
                  {topic.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                      <Hash size={10} /> {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
