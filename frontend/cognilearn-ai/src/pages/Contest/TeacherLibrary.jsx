import { Text, Title, Button, Modal, TextInput, ScrollArea, UnstyledButton, Group, Center, SimpleGrid, Table, Pagination } from "@mantine/core";
import Navbar from "../../components/Layouts/Navbar";
import axiosInstance from "../../utils/axiosInsantce";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ContestResult from "./ContestResult"; 
import ContestCard from "../../components/Cards/ContestCard";
import { IconSearch } from "@tabler/icons-react";

const TeacherLibrary = ({ userInfo }) => {
  const userId = userInfo.id
  const navigate = useNavigate();
  const [latestContests, setLatestContests] = useState([]);
  const [contestResults, setContestResults] = useState([]);
  const [yourContests, setYourContests] = useState([]);

  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState(1);

  
  const [search1, setSearch1] = useState("");
  const [activePage1, setActivePage1] = useState(1);

  const pageSize = 5; // mỗi trang tối đa 20 contest

  const fetchLatestContests = async () => {
    try {
      const res = await axiosInstance.get("/get-contests");
      setLatestContests(res.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy các cuộc thi:", err);
    }
  };

  const fetchYourContest = async () => {
    try {
      const res = await axiosInstance.get(`/get-contest-user/${userInfo?.id}`);
      setYourContests(res.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy các cuộc thi:", err);
    }
  }

  const fetchContestResults = async () => {
    try {
      const res = await axiosInstance.get(`/get-contest-results?userId=${userId}&limit=5`);
      setContestResults(res.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy kết quả:", err);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.currentTarget.value);
    setActivePage(1); // reset về trang đầu khi search
  };

  const handleSearchChange1 = (event) => {
    setSearch1(event.currentTarget.value);
    setActivePage1(1); // reset về trang đầu khi search
  };

  const displayedContests = latestContests.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const displayedContests1 = yourContests.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedContest = displayedContests.slice(startIndex, endIndex);

  const startIndex1 = (activePage1 - 1) * pageSize;
  const endIndex1 = startIndex1 + pageSize;
  const paginatedContest1 = displayedContests1.slice(startIndex1, endIndex1);

  useEffect(() => {
    if (!userInfo?.id) return;
    fetchLatestContests();
    fetchContestResults();
    fetchYourContest();
  }, [userInfo]);

  return (
    <div className="flex lexend h-screen bg-gray-50">
      {/* 🔹 Sidebar */}
      <Navbar />

      {/* 🔹 Main Content */}
      <main className="flex-1 p-6 main-content overflow-y-auto">
        <div className="flex items-center justify-between mb-6 text-xl text-[#112D4E] font-semibold">
          Thư viện
        </div>

        {/* 🔹 Danh sách contest */}
        <div className="p-5 bg-white shadow rounded-2xl mb-6 text-[#112D4E]">
          <Title order={4}>Danh sách bài kiểm tra</Title>
          <TextInput
            placeholder="Search contest..."
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />

          {paginatedContest.length > 0 ? (
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} // tối đa 5 card 1 hàng
              spacing="lg"
              verticalSpacing="lg"
            >
              {paginatedContest.map((contest) => (
                <ContestCard
                  key={contest.id}
                  name={contest.name}
                  date={contest.created_at}
                  path={`/contest/${contest.id}`}
                  userInfo={contest.author}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" fw={500} mt="md">
              Nothing found
            </Text>
          )}
          {latestContests.length > pageSize && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(latestContests.length / pageSize)}
                value={activePage}
                onChange={setActivePage}
              />
            </div>
          )}
        </div>
        <div className="p-5 bg-white shadow rounded-2xl mb-6 text-[#112D4E]">
          <Title order={4}>Danh sách bài kiểm tra của tôi</Title>
          <TextInput
            placeholder="Search contest..."
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search1}
            onChange={handleSearchChange1}
          />

          {paginatedContest1.length > 0 ? (
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} // tối đa 5 card 1 hàng
              spacing="lg"
              verticalSpacing="lg"
            >
              {paginatedContest1.map((contest) => (
                <ContestCard
                  key={contest.id}
                  name={contest.name}
                  date={contest.created_at}
                  path={`/contest/${contest.id}`}
                  userInfo={contest.author}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" fw={500} mt="md">
              Nothing found
            </Text>
          )}
          {yourContests.length > pageSize && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(yourContests.length / pageSize)}
                value={activePage1}
                onChange={setActivePage1}
              />
            </div>
          )}
        </div>
      </main>
      <button
        className="w-50 h-16 flex items-center justify-center rounded-full text-white bg-[#112D4E] hover:bg-[#C6E7FF] hover:text-[#112D4E] fixed right-10 bottom-10 cursor-pointer transition-all shadow-lg"
        onClick={() => {
        navigate("/create-contest");
        }}
     >
          Tạo bài kiểm tra
      </button>
    </div>
  );
};

export default TeacherLibrary;
