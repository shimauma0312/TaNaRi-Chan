"use client"

import MinLoader from "@/components/MinLoader"
import ShakeImage from "@/components/ShakeImage"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"

const mockData = {
  timelineArticles: [
    { id: 1, title: "Article 1", content: "Content of Article 1" },
    { id: 2, title: "Article 2", content: "Content of Article 2" },
    { id: 3, title: "Article 3", content: "Content of Article 3" },
    { id: 4, title: "Article 4", content: "Content of Article 4" },
    { id: 5, title: "Article 5", content: "Content of Article 5" },
  ],
  activeTodos: [
    {
      id: 1,
      title: "Todo 1",
      description: "Description of Todo 1",
      deadline: "2023-12-31",
    },
    {
      id: 2,
      title: "Todo 2",
      description: "Description of Todo 2",
      deadline: "2023-12-31",
    },
    {
      id: 3,
      title: "Todo 3",
      description: "Description of Todo 3",
      deadline: "2023-12-31",
    },
  ],
  publicTodos: [
    {
      id: 1,
      title: "Public Todo 1",
      description: "Description of Public Todo 1",
      deadline: "2023-12-31",
    },
    {
      id: 2,
      title: "Public Todo 2",
      description: "Description of Public Todo 2",
      deadline: "2023-12-31",
    },
    {
      id: 3,
      title: "Public Todo 3",
      description: "Description of Public Todo 3",
      deadline: "2023-12-31",
    },
    {
      id: 4,
      title: "Public Todo 4",
      description: "Description of Public Todo 4",
      deadline: "2023-12-31",
    },
    {
      id: 5,
      title: "Public Todo 5",
      description: "Description of Public Todo 5",
      deadline: "2023-12-31",
    },
  ],
}

const DashboardPage = () => {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4 relative">
        <div className="container mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-xl">Welcome, {user.user_email}</p>
            <p className="text-lg">
              Today's Date: {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <ShakeImage />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">
                Random Timeline Articles
              </h2>
              <ul className="space-y-2">
                {mockData.timelineArticles.map((article) => (
                  <li key={article.id} className="p-2 border rounded-md">
                    <div className="block hover:underline cursor-pointer">
                      <h3 className="font-bold">{article.title}</h3>
                      <p>{article.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Your Active Todos</h2>
              <ul className="space-y-2">
                {mockData.activeTodos.map((todo) => (
                  <li key={todo.id} className="p-2 border rounded-md">
                    <div className="block hover:underline cursor-pointer">
                      <h3 className="font-bold">{todo.title}</h3>
                      <p>{todo.description}</p>
                      <p>
                        Deadline: {new Date(todo.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Public Todos</h2>
              <ul className="space-y-2">
                {mockData.publicTodos.map((todo) => (
                  <li key={todo.id} className="p-2 border rounded-md">
                    <div className="block hover:underline cursor-pointer">
                      <h3 className="font-bold">{todo.title}</h3>
                      <p>{todo.description}</p>
                      <p>
                        Deadline: {new Date(todo.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
