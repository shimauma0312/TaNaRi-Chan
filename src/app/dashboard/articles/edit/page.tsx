"use client"

import ArticleForm from "@/components/ArticleForm"
import MinLoader from "@/components/MinLoader"
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

  const handleSuccess = () => {
    router.push("/dashboard/articles");
  };

  if (postId === null) {
    return <div className="text-center p-8">Invalid article ID.</div>;
  }

  return (
    <ArticleForm 
      postId={postId}
      initialTitle={title}
      initialContent={content}
      onSuccess={handleSuccess}
    />
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
      <EditArticleContent postId={postId} />
    </Suspense>
  );
}

export default EditArticlePage;
