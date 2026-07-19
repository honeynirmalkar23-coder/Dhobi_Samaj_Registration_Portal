import { DatabaseZap } from "lucide-react";
import { EmptyState } from "../../../components/common/EmptyState";

export function AdminDataUnavailableState() {
  return (
    <EmptyState
      description="पंजीकरण डेटाबेस अभी जुड़ा नहीं है। इसलिए कोई वास्तविक पंजीकरण रिकॉर्ड प्राप्त नहीं किया गया है।"
      icon={DatabaseZap}
      title="पंजीकरण डेटा उपलब्ध नहीं है"
    />
  );
}
