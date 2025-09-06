import { Text, Title, Table, Button, Modal } from "@mantine/core";
import Navbar from "../../components/Layouts/Navbar";
import axiosInstance from "../../utils/axiosInsantce";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ContestResult from "./ContestResult"; 
import ContestCard from "../../components/Cards/ContestCard";

const Library = ({ userInfo }) => {
  const navigate = useNavigate();
  const [latestContests, setLatestContests] = useState([]);
  const [contestResults, setContestResults] = useState([]);
  const [opened, setOpened] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchLatestContests = async () => {
    try {
      const res = await axiosInstance.get("/get-contests");
      setLatestContests(res.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy các cuộc thi:", err);
    }
  };

  const fetchContestResults = async () => {
    try {
      const res = await axiosInstance.get(`/get-contest-results?userId=${userInfo.id}&limit=5`);
      setContestResults(res.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy kết quả:", err);
    }
  };
  console.log(latestContests);
  useEffect(() => {
    if (!userInfo?.id) return;
    fetchLatestContests();
    fetchContestResults();
  }, [userInfo]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 🔹 Sidebar */}
      <Navbar />

      {/* 🔹 Main Content */}
      <main className="flex-1 p-6 main-content overflow-y-auto">
        <div className="flex items-center justify-between mb-6 text-xl text-[#112D4E] font-semibold">
          📚 Thư viện
        </div>

        {/* 🔹 Danh sách contest gần đây */}
        <div className="p-5 bg-white shadow rounded-2xl mb-6 text-[#112D4E]">
          <Title order={4}>Bài kiểm tra gần đây</Title>
          <div className="grid grid-cols-8 gap-4 mt-3 col-span-full">
            {latestContests.length > 0 ? (
              latestContests.map((contest) => (
                <ContestCard  
                  key={contest.id}
                  name={contest.name}
                  date={contest.created_at}
                  path={`/contest/${contest.id}`}
                  userInfo={contest.author}
                />
              ))
            ) : (
              <Text size="sm" color="#112D4E">
                Không có contest nào
              </Text>
            )}
          </div>
        </div>
        
      <div className="p-5 bg-white shadow rounded-2xl mb-6 text-[#112D4E]">
          <Title order={4}>Bài kiểm tra đề xuất</Title>
          <div className="grid grid-cols-8 gap-4 mt-3">
            {latestContests.length > 0 ? (
              latestContests.map((contest) => (
                <ContestCard
                  key={contest.id}
                  name={contest.name}
                  date={contest.created_at}
                  path={`/contest/${contest.id}`}
                  userInfo={contest.author}
                />
              ))
            ) : (
              <Text size="sm" color="#112D4E">
                Không có contest nào
              </Text>
            )}
          </div>
        </div>


        {/* 🔹 Bảng lịch sử làm bài */}
        <div className="p-5 bg-white shadow rounded-2xl text-[#112D4E]">
          <Title order={4}>Lịch sử làm bài</Title>
          {contestResults.length > 0 ? (
            <Table
              highlightOnHover
              className="mt-3 rounded-lg shadow-sm text-[#112D4E] custom-table"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th color="#112D4E">Tên Contest</Table.Th>
                  <Table.Th>Điểm</Table.Th>
                  <Table.Th>Ngày làm</Table.Th>
                  <Table.Th style={{ width: "150px", textAlign: "center" }}>Hành động</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {contestResults.map((result) => (
                  <Table.Tr key={result.id}>
                    <Table.Td
                      className="cursor-pointer text-[#112D4E] hover:underline"
                      onClick={() => navigate(`/contest/${result.contest_id}`)}
                    >
                      {result.name}
                    </Table.Td>
                    <Table.Td>{result.point}</Table.Td>
                    <Table.Td>{new Date(result.created_at).toLocaleString()}</Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      <Button
                        size="xs"
                        variant="light"
                        color="indigo"
                        onClick={() => {
                          setSelectedResult(result);
                          setOpened(true);
                        }}
                      >
                        Xem báo cáo
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

          ) : (
            <Text size="sm" color="dimmed" className="mt-3">
              Bạn chưa có lịch sử làm bài nào
            </Text>
          )}
        </div>
      </main>

      {/* 🔹 Modal Xem Báo Cáo */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="📑 Báo cáo kết quả"
        size="lg"
        radius="md"
      >
        {selectedResult && (
          <ContestResult result={selectedResult} />
        )}
      </Modal>
    </div>
  );
};

export default Library;
