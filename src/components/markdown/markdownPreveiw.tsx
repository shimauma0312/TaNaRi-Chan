import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Link from "@mui/material/Link"
import Paper from "@mui/material/Paper"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import ReactMarkdown, { type Components } from "react-markdown"
import breaks from "remark-breaks"
import remarkGfm from "remark-gfm"

interface MarkdownPreviewProps {
  markdown: string
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <Typography
      component="h1"
      variant="h3"
      sx={{ mb: 3, borderBottom: 1, borderColor: "divider", pb: 1.5 }}
    >
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography
      component="h2"
      variant="h4"
      sx={{ mb: 2, borderBottom: 1, borderColor: "divider", pb: 1 }}
    >
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography component="h3" variant="h5" sx={{ mb: 1.5 }}>
      {children}
    </Typography>
  ),
  h4: ({ children }) => (
    <Typography component="h4" variant="h6" sx={{ mb: 1 }}>
      {children}
    </Typography>
  ),
  h5: ({ children }) => (
    <Typography component="h5" variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
      {children}
    </Typography>
  ),
  h6: ({ children }) => (
    <Typography component="h6" variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography component="p" sx={{ mb: 2, lineHeight: 1.75 }}>
      {children}
    </Typography>
  ),
  strong: ({ children }) => (
    <Box component="strong" sx={{ fontWeight: 700, color: "text.primary" }}>
      {children}
    </Box>
  ),
  em: ({ children }) => (
    <Box component="em" sx={{ color: "text.primary" }}>
      {children}
    </Box>
  ),
  code: ({ children, className }) => (
    <Box
      component="code"
      className={className}
      sx={{
        borderRadius: 0.5,
        bgcolor: "rgba(15, 23, 42, 0.9)",
        color: "#f9a8d4",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "0.875em",
        px: 0.75,
        py: 0.25,
      }}
    >
      {children}
    </Box>
  ),
  pre: ({ children }) => (
    <Paper
      component="pre"
      variant="outlined"
      sx={{
        bgcolor: "#0f172a",
        mb: 2,
        overflowX: "auto",
        p: 2,
        "& code": { bgcolor: "transparent", color: "text.primary", p: 0 },
      }}
    >
      {children}
    </Paper>
  ),
  blockquote: ({ children }) => (
    <Paper
      component="blockquote"
      variant="outlined"
      sx={{
        borderLeft: 4,
        borderLeftColor: "primary.main",
        fontStyle: "italic",
        m: 0,
        mb: 2,
        px: 2,
        py: 1,
      }}
    >
      {children}
    </Paper>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ mb: 2, pl: 3 }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ mb: 2, pl: 3 }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Box component="li" sx={{ mb: 0.5 }}>
      {children}
    </Box>
  ),
  a: ({ children, href }) => <Link href={href}>{children}</Link>,
  table: ({ children }) => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table size="small">{children}</Table>
    </TableContainer>
  ),
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => (
    <TableCell component="th" sx={{ fontWeight: 700 }}>
      {children}
    </TableCell>
  ),
  td: ({ children }) => <TableCell>{children}</TableCell>,
  hr: () => <Divider sx={{ my: 3 }} />,
  img: ({ alt, src }) => (
    <Box
      component="img"
      alt={alt ?? ""}
      src={typeof src === "string" ? src : undefined}
      sx={{
        borderRadius: 1,
        boxShadow: 3,
        display: "block",
        height: "auto",
        mb: 2,
        maxWidth: "100%",
      }}
    />
  ),
}

const MarkdownPreview = ({ markdown }: MarkdownPreviewProps) => (
  <Box sx={{ color: "text.primary", fontSize: "1rem", lineHeight: 1.7, overflowWrap: "anywhere" }}>
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm, breaks]}>
      {markdown}
    </ReactMarkdown>
  </Box>
)

export default MarkdownPreview
