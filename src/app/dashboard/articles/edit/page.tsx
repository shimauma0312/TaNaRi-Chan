"use client"

import ArticleForm from "@/components/ArticleForm"
import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

async function fetchArticleData(postId: number) {
  try {
    const response = await fetch(`/api/articles?post_id=${postId}`);
    const data = await response.json();
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
  const [articleData, setArticleData] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId === null) {
      setLoading(false);
      return;
    }

    const loadArticleData = async () => {
      setLoading(true);
      try {
        const data = await fetchArticleData(postId);
        setArticleData(data);
      } catch (error) {
        console.error("Failed to load article:", error);
        setArticleData({ title: "", content: "" });
      } finally {
        setLoading(false);
      }
    };

    loadArticleData();
  }, [postId]);

  const handleSuccess = () => {
    router.push("/dashboard/articles");
  };

  if (postId === null) {
    return <div className="text-center p-8">Invalid article ID.</div>;
  }

  if (loading) {
    return <MinLoader />;
  }

  return (
      <div className="min-h-screen text-white p-4 flex">
        <SideMenu />
        <ArticleForm 
          postId={postId}
          initialTitle={articleData.title}
          initialContent={articleData.content}
          onSuccess={handleSuccess}
        />
      </div>
  );
}

const EditArticlePage = () => {
  const { user, loading } = useAuth();
  const [postId, setPostId] = useState<number | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const postIdParam = searchParams.get('post_id');
    if (postIdParam) {
      setPostId(Number(postIdParam));
    }
  }, [searchParams]);

  if (loading || !user) {
    return <MinLoader />;
  }

  return <EditArticleContent postId={postId} />;
}

export default EditArticlePage;
