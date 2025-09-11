import React from 'react';
import { Modal as MantineModal, Group, Button, Text } from '@mantine/core';

export function PopUpModal({ opened, onClose }) {
  return (
    <div className="lexend">
      <MantineModal opened={opened} onClose={onClose} title="Thành công!">
        <Text>Bạn đã phù hợp để làm giáo viên rồi, không cần định hướng đâu!</Text>
        <Group position="right" mt="md">
          <Button onClick={onClose}>Đóng</Button>
        </Group>
      </MantineModal>
    </div>
  );
}