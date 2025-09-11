import React, { useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Card,
  Center,
  Group,
  Image,
  Text,
  useMantineTheme,
  Modal,
  Button,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import "./ArticleCard.css";
import axiosInstance from "../../utils/axiosInsantce";

export default function ArticleCard({
  contestId,
  name,
  date,
  path,
  userInfo,
  authorId,
  teacherId,
  onDeleteSuccess,   // callback mới
}) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);

  const handleDeleteContest = async () => {
    try {
      await axiosInstance.delete(`delete-contest/${contestId}`);
      console.log("Deleted contest", contestId);
      setOpened(false);
      if (onDeleteSuccess) {
        onDeleteSuccess(contestId); // báo cho parent xoá card khỏi list
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleNavigate = () => {
    navigate(path);
  };

  return (
    <div className="lexend">
      {/* Modal confirm */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Xác nhận xoá"
        centered
      >
        <Text>Bạn có chắc chắn muốn xoá contest này không?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Huỷ
          </Button>
          <Button color="red" onClick={handleDeleteContest}>
            Xoá
          </Button>
        </Group>
      </Modal>

      <Card
        withBorder
        radius="md"
        className="card"
        onClick={handleNavigate}
        style={{ cursor: "pointer", position: "relative" }}
      >
        {/* Icon thùng rác */}
        {authorId === teacherId && <ActionIcon
          variant="light"
          color="red"
          onClick={(e) => {
            e.stopPropagation();
            setOpened(true);
          }}
          style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}
        >
          <IconTrash size={18} />
        </ActionIcon>}

        <Card.Section>
          <Image src="https://i.imgur.com/1Ew4mrb.png" height={180} />
        </Card.Section>

        <Badge
          className="rating"
          variant="gradient"
          gradient={{ from: "yellow", to: "red" }}
        >
          Hot
        </Badge>

        <Text className="title" onClick={handleNavigate} style={{ cursor: "pointer" }}>
          {name}
        </Text>

        <Text style={{ fontSize: "14px", color: "#868e96" }}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </Text>

        <Group justify="space-between" className="footer">
          <Center>
            <Avatar
              src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png"
              size={24}
              radius="xl"
              style={{ marginRight: "8px" }}
            />
            <Text style={{ fontSize: "14px" }} inline>
              {userInfo}
            </Text>
          </Center>
        </Group>
      </Card>
    </div>
  );
}
