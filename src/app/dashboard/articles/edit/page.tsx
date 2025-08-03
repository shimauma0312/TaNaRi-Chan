"use client"

import MarkdownEditor from "@/components/markdown/markdownEditor"
import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Suspense, use, useEffect, useState } from "react"


function useArticleData(postId: number | null) {
  if (postId === null) {
    return { title: "", content: "" };
  }
  const articleDataPromise = fetchArticleData(postId);

  return use(articleDataPromise);
}

async function fetchArticleData(postId: number) {
  try {
    const response = await fetch(`/api/articles?post_id=${postId}`);
    const data = await response.json();
    console.log("Fetched article:", data);
    return {
      title: data.title ?? "",
      content: data.content ?? ""
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return { title: "", content: "" };
  }
}

function EditArticleContent({ postId }: { postId: number | null }) {
  const router = useRouter();
  const { title, content } = useArticleData(postId);
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);

  // 初期データが変わったら編集可能な状態も更新
  useEffect(() => {
    setEditableTitle(title);
    setEditableContent(content);
  }, [title, content]);

  /**
   * 記事を更新する
   * @param event : React.FormEvent
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!postId) {
      alert("Invalid post ID.");
      return;
    }

    const updatedPost = {
      post_id: postId,
      title: editableTitle,
      content: editableContent,
    };

    try {
      const response = await fetch("/api/articles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPost),
      });

      if (response.ok) {
        router.push("/dashboard/articles");
      } else {
        alert("Failed to update article.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while updating the article.");
    }
  };

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="max-w-md mx-auto p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Edit Article</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-gray-700 font-semibold mb-2"
              >
                Title:
              </label>
              <input
                type="text"
                id="title"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                required
                className="bg-slate-800 w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="content"
                className="block text-gray-700 font-semibold mb-2"
              >
                Content:
              </label>
              <MarkdownEditor initialMarkdown={editableContent} onChange={setEditableContent} />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Article
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const EditArticlePage = ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const { user, loading } = useAuth();
  const [postId, setPostId] = useState<number | null>(null);

  useEffect(() => {
    const getSearchParams = async () => {
      const params = await searchParams;
      const postIdParam = params.post_id;
      if (postIdParam) {
        setPostId(Number(postIdParam));
      }
    };

    getSearchParams();
  }, [searchParams]);

  if (!user) {
    return <MinLoader />;
  }

  return (
    <Suspense fallback={<MinLoader />}>
      {postId && <EditArticleContent postId={postId} />}
      {!postId && <div className="text-center p-8">Invalid article ID.</div>}
    </Suspense>
  );
}

export default EditArticlePage;
