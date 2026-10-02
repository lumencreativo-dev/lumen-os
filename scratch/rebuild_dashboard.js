const fs = require('fs');

let content = fs.readFileSync('components/team/DashboardView.tsx', 'utf8');

// 1. Inject framer-motion import
if (!content.includes('import { motion }')) {
    content = content.replace(
        'import Link from "next/link";',
        'import Link from "next/link";\nimport { motion } from "framer-motion";'
    );
}

// 2. Define the animation variants
const variantsCode = `
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };
`;
content = content.replace(
    'const [loading, setLoading] = useState(true);',
    variantsCode + '\n    const [loading, setLoading] = useState(true);'
);

// 3. Replace the main return block to use motion.div
content = content.replace(
    '<div className="space-y-8">',
    '<motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="show">'
);
content = content.replace(
    '</div >\n    );\n}',
    '</motion.div>\n    );\n}'
);

// 4. Wrap the first grid (Top Stats) and second grid in stagger items
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">',
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'
);

// Replace Link elements with motion.div wrapped Links for cards
content = content.replace(/<Link href="\/dashboard\/admin\/clients"\>[\s\S]*?<\/Link>/, match => {
    return `<motion.div variants={itemVariants}>
                ${match}
            </motion.div>`;
});
content = content.replace(/<Link href="\/dashboard\/leads"\>[\s\S]*?<\/Link>/, match => {
    return `<motion.div variants={itemVariants}>
                ${match}
            </motion.div>`;
});
content = content.replace(/<Link href="\/dashboard\/deliverables"\>[\s\S]*?<\/Link>/, match => {
    return `<motion.div variants={itemVariants}>
                ${match}
            </motion.div>`;
});
content = content.replace(/<Link href="\/dashboard\/finance"\>[\s\S]*?<\/Link>/, match => {
    return `<motion.div variants={itemVariants}>
                ${match}
            </motion.div>`;
});

// Second Row stats wrapped in item variants
content = content.replace(
    /<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white">/g,
    '<motion.div variants={itemVariants} className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-xl shadow-gray-900/20 hover:shadow-2xl transition-shadow">'
);

content = content.replace(
    /<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">/g,
    '<motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">'
);

// Since we replaced opening divs with motion.div for the 3 secondary cards, we need to match the closing ones.
// It's safer to just rewrite the whole return block, but let's try a regex for the closing tags.
// Actually, I can just replace `</div >\n    );\n}` with `</motion.div>\n    );\n}` earlier (which I did).
// BUT those 3 inner divs need closing `</motion.div>` instead of `</div>`.
content = content.replace(
    /<\/div>\n            <\/div>\n        <\/motion\.div>/,
    '</motion.div>\n            </div>\n        </motion.div>' // 3rd card
);
// This regex approach is brittle. Let's do a complete clean rewrite of the JSX return block for maximum quality!

fs.writeFileSync('scratch/rebuild_dashboard.js', content); // saving progress, not the target file
