import ArrowForwardOutlinedIcon from "@suid/icons-material/ArrowForwardOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  TextField,
} from "@suid/material";
import { green, grey, red } from "@suid/material/colors";
import { Component, createSignal, onMount } from "solid-js";

import { portforwardService } from "../../../../../services";
import { Pod } from "../../../../../services/pod.ts";
import { useKubeStore, usePortforwardStore } from "../../../../../stores";

interface PortforwardActionProps {
  podName: string;
  containerName: string;
  ports: Pod["spec"]["containers"][0]["ports"];
}

const PortforwardAction: Component<PortforwardActionProps> = (props) => {
  const [containerPort, setContainerPort] = createSignal<string>("");
  const [localPort, setLocalPort] = createSignal<string>("");
  const portforward = usePortforwardStore((state) => state.portforward);

  const [open, setOpen] = createSignal<boolean>(false);

  const add = usePortforwardStore((state) => state.add);
  const remove = usePortforwardStore((state) => state.remove);

  const namespace = useKubeStore((state) => state.namespace);

  const defaultContainerPort = () => props.ports?.[0].containerPort;

  const pfName = () => `${props.podName}/${props.containerName}`;

  onMount(() => {
    const port = defaultContainerPort();
    if (port) {
      setContainerPort(port.toString());
      setLocalPort(port.toString());
    }
  });

  const handleOpen = async () => {
    if (portforward()[pfName()]) {
      await portforwardService.stop_portforward(props.podName);
      remove(pfName());
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePortforwardClick = async () => {
    await portforwardService.start_portforward(
      namespace(),
      "pod",
      props.podName,
      parseInt(containerPort()),
      parseInt(localPort()),
    );
    add(pfName());
    setOpen(false);
  };

  const getButtonColor = () => {
    if (!defaultContainerPort()) {
      return grey[500];
    } else if (portforward()[pfName()]) {
      return green[500];
    } else {
      return red[500];
    }
  };

  return (
    <>
      <IconButton onclick={handleOpen} disabled={!defaultContainerPort()}>
        <ArrowForwardOutlinedIcon sx={{ color: getButtonColor() }} />
      </IconButton>
      <Dialog open={open()} onClose={handleClose}>
        <DialogTitle>Portforward</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <TextField
              label="Container Port"
              variant="standard"
              value={containerPort()}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              label="Local Port"
              variant="standard"
              value={localPort()}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handlePortforwardClick}>Start</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PortforwardAction;
